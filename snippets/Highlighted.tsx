"use client";

import clsx from "clsx";
import { useRef } from "react";
import { Link } from "../../atoms";
import { IconName } from "../../atoms/Icon/Icon";
import { Introduction } from "../../molecules";
import Post from "../../molecules/Post/Post";
import { FieldImage, FieldLink, HeadingTag } from "../../types";
import { updateHeading } from "../../utils/updateHeading";

export type HighlightedItem = {
	icon?: IconName;
	image?: FieldImage;
	link?: FieldLink;
	publishDate?: string;
	publishDateLabel?: string;
	taxonomy?: string;
	title?: string;
};

export type HighlightedProps = {
	items?: HighlightedItem[];
	link?: FieldLink;
	publishDate?: string;
	publishDateLabel?: string;
	taxonomy?: string;
	title?: string;
	titleTag?: HeadingTag;
	noResultsMessage?: string;
};

const Highlighted = ({
	title,
	titleTag = "h2",
	link,
	items,
	noResultsMessage,
}: HighlightedProps) => {
	const ref = useRef<HTMLDivElement>(null);

	if (!items || items.length === 0) {
		if (!title) {
			return null;
		}

		return (
			<section className={clsx("highlighted")}>
				<div className={clsx("highlighted__posts")}>
					<div className={clsx("highlighted__wrapper")}>
						<Introduction title={title} titleTag={titleTag} link={link} />
						<div className="highlighted__body">
							<p>{noResultsMessage || ""}</p>
						</div>
					</div>
				</div>
			</section>
		);
	}

	const [latest, ...featured] = items || [];

	const handleScroll = (event: React.UIEvent) => {
		const target = event.target as HTMLDivElement;

		if (!target) {
			return;
		}

		if (!ref || !ref.current) {
			return;
		}

		// Indicator position could be different than the actual carousel.
		const offsetWidth =
			12 + (target.parentElement?.offsetWidth || target.offsetWidth || 0);
		const ratio = (offsetWidth / target.scrollWidth) * 100;
		const left =
			(100 / (target.scrollWidth / target.scrollLeft) / 100) * offsetWidth;

		ref.current.style.width = `${ratio}%`;
		ref.current.style.transform = `translateX(${left}px)`;
	};

	return (
		<section className={clsx("highlighted")}>
			<div className={clsx("highlighted__posts")}>
				<div className={clsx("highlighted__wrapper")}>
					<Introduction title={title} titleTag={titleTag} link={link} />

					<div className="highlighted__body">
						<div
							className={clsx("highlighted__overview")}
							onScroll={(event) => handleScroll(event)}
						>
							{latest && (
								<div className={clsx("highlighted__latest")}>
									<Post
										isFeatured
										taxonomy={latest.taxonomy}
										title={latest.title}
										image={latest.image}
										icon={latest.icon}
										link={latest.link}
										publishDate={latest.publishDate}
										publishDateLabel={latest.publishDateLabel}
									/>
								</div>
							)}

							{Array.isArray(featured) && (
								<aside className={clsx("highlighted__featured")}>
									<ul className={clsx("highlighted__items")}>
										{featured.map((item, index) => {
											return (
												<li
													key={`highlighted-item-${index}`}
													className={clsx("highlighted__item")}
												>
													<Post
														icon={item.icon}
														image={item.image}
														isFeatured={featured.length === 1}
														link={item.link}
														publishDate={item.publishDate}
														publishDateLabel={item.publishDateLabel}
														taxonomy={item.taxonomy}
														title={item.title}
														titleTag={updateHeading(titleTag) as HeadingTag}
													/>
												</li>
											);
										})}
									</ul>
								</aside>
							)}
						</div>

						<div
							ref={ref}
							className={clsx("highlighted__scroll-indicator")}
						></div>
					</div>
				</div>
			</div>

			{link && (
				<div className="highlighted__links">
					<Link
						href={link.href}
						isSecondary
						isExternal={link.isExternal}
						isBlank={link.isBlank}
					>
						{link.label}
					</Link>
				</div>
			)}
		</section>
	);
};

export default Highlighted;
