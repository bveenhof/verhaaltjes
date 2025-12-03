"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heading } from "../../atoms";
import { SelectOption } from "../../atoms/Form/Select";
import { Pagination } from "../../molecules";
import Post, { PostProps } from "../../molecules/Post/Post";
import { useSessionContext } from "../../providers/SessionProvider";
import { HeadingTag } from '../../types';
import CategorySelector from "../CategorySelector/CategorySelector";
import Highlighted from "../Highlighted/Highlighted";

export type BlogPostOverviewProps = {
	title?: string;
	headingType?: HeadingTag;
	items?: PostProps[];
	itemsPerPage?: number;
	featuredItemAmount?: number;
	initialPage?: number;
	blogFilterOnChange?: (index: number) => void;
	uniqueCategories?: SelectOption[];
};

const BlogPostOverview = ({
	title,
	headingType = "h2",
	items = [],
	initialPage = 0,
	itemsPerPage = 8,
	featuredItemAmount = 5,
	blogFilterOnChange,
	uniqueCategories = [],
}: BlogPostOverviewProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const [isReady, setIsReady] = useState<boolean>(false);

	const currentPageKey = "blogPostOverview.currentPage";
	const sessionContext = useSessionContext();
	const [visibleFeatured, setVisibleFeatured] = useState<
		PostProps[] | undefined
	>(undefined);

	const [visibleRest, setVisibleRest] = useState<PostProps[] | undefined>(
		undefined,
	);

	const [currentPage, setCurrentPage] = useState(
		sessionContext?.read<number>(currentPageKey, "number") || initialPage,
	);
	const [pageAmount, setPageAmount] = useState(0);

	const allOptions: SelectOption[] = useMemo(() => {
		return [{ label: "All categories", value: "" }, ...uniqueCategories];
	}, [uniqueCategories]);

	const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
		undefined,
	);

	// Current category is mirrored in the URL (?category=slug) so links/bookmarks restore state
	useEffect(() => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		const cat = params.get("category") || undefined;
		setSelectedCategory(cat || undefined);

		// Keep in sync on browser back/forward navigation
		const onPopState = () => {
			const p =
				new URLSearchParams(window.location.search).get("category") ||
				undefined;
			setSelectedCategory(p || undefined);
		};

		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, []);

	// Drive select's index from the URL-driven category; 0 = "All categories"
	const selectedIndex = useMemo(() => {
		if (!selectedCategory) return 0;
		const index = allOptions.findIndex(
			(opt) => String(opt.value) === String(selectedCategory),
		);
		return index >= 0 ? index : 0;
	}, [allOptions, selectedCategory]);

	// Precompute valid category values (slugs) to validate URL param
	const validCategoryValues = useMemo(() => {
		return new Set(
			(uniqueCategories || []).map((o) => String(o.value).toLowerCase()),
		);
	}, [uniqueCategories]);

	// Filter by category using a slugified taxonomy so labels remain human-friendly
	const filteredItems = useMemo(() => {
		if (!selectedCategory) return items;
		const selectedSlug = String(selectedCategory).toLowerCase();
		if (!validCategoryValues.has(selectedSlug)) return items;
		return items.filter((post) => {
			const taxonomy = (post.taxonomy || "").toLowerCase();
			if (!taxonomy) return false;
			const slug = taxonomy.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
			return slug === selectedSlug;
		});
	}, [items, selectedCategory, validCategoryValues]);

	// Notify parent whenever the effective selection changes (including URL-driven changes)
	useEffect(() => {
		blogFilterOnChange?.(selectedIndex);
	}, [selectedIndex, blogFilterOnChange]);

	const from = itemsPerPage * currentPage;
	const to = Math.min(from + itemsPerPage, filteredItems.length);

	// Recompute pagination based on filtered results
	useEffect(() => {
		if (filteredItems && filteredItems.length) {
			const amount = Math.ceil(filteredItems.length / itemsPerPage);

			if (amount !== pageAmount) {
				setPageAmount(amount);
			}
		}
	}, [filteredItems, itemsPerPage, pageAmount, setPageAmount]);

	useEffect(() => {
		if (isReady && ref.current) {
			ref.current.scrollIntoView({ behavior: "instant" });
		}
	}, [currentPage, isReady, ref]);

	// Compute items for the current page. Expose featured items only on page 0
	useEffect(() => {
		const from = itemsPerPage * currentPage;
		const to = Math.min(from + itemsPerPage, filteredItems.length);

		const currentItems = filteredItems.slice(from, to);
		const maxFeaturedItems = Math.min(itemsPerPage, featuredItemAmount);

		setVisibleFeatured(
			!currentPage && filteredItems.length
				? currentItems.slice(0, maxFeaturedItems)
				: undefined,
		);

		setVisibleRest(
			!currentPage && currentItems
				? currentItems.slice(maxFeaturedItems)
				: currentItems,
		);
	}, [currentPage, featuredItemAmount, filteredItems, itemsPerPage, from, to]);

	useEffect(() => {
		if (sessionContext) {
			sessionContext.write(currentPageKey, currentPage);
		}
	}, [currentPage, sessionContext]);

	return (
		<div className={clsx("blog-post-overview")} ref={ref}>
			<div className="blog-post-overview__header">
				{title && (
					<Heading type="h1" tag={headingType}>
						{title}
					</Heading>
				)}
				{uniqueCategories.length !== 0 && (
					<CategorySelector
						key={selectedIndex}
						options={allOptions}
						selectedIndex={selectedIndex}
						// Update URL (pushState), sync local state, and reset to page 0
						onChange={(_, ctx) => {
							const value = String(ctx?.value || "");
							if (typeof window !== "undefined") {
								const url = new URL(window.location.href);
								if (!value) {
									url.searchParams.delete("category");
								} else {
									url.searchParams.set("category", value);
								}
								window.history.pushState({}, "", url.toString());
							}
							setSelectedCategory(value || undefined);
							setCurrentPage(0);
						}}
					/>
				)}
			</div>

			{visibleFeatured && <Highlighted items={visibleFeatured} />}

			<div className="blog-post-overview__posts">
				{visibleRest &&
					visibleRest.map((post, index) => (
						<Post
							key={index}
							title={post.title}
							image={post.image}
							link={post.link}
							publishDate={post.publishDate}
							publishDateLabel={post.publishDateLabel}
							taxonomy={post.taxonomy}
							icon={post.icon}
						/>
					))}
			</div>

			<div className="blog-post-overview__pagination">
				<Pagination
					includeTotal
					currentPage={currentPage}
					ignoreNext={currentPage + 1 >= pageAmount}
					size={pageAmount}
					onUpdate={(currentIndex) => {
						setIsReady(true);
						setCurrentPage(currentIndex);
					}}
				/>
			</div>
		</div>
	);
};

export default BlogPostOverview;
