/**
 * Expand and route text-only slides (medium/high) for denser copy + multi-list columns.
 */

import { slideShouldHaveImage } from "./layoutCadence";
import { isListElement, countListItems } from "./layoutUtils";

const normDensity = (meta) =>
  String(meta?.textAmount || "medium").toLowerCase();

export const isTextOnlySlide = (meta, slideIndex, slideCount = 0) => {
  if (slideIndex <= 0) return false;
  return !slideShouldHaveImage(meta, slideIndex, slideCount);
};

/** Split one bulleted-list element into N chunks (default half). */
export const splitListElementInHalf = (el) => {
  if (!el?.content || !Array.isArray(el.content)) return [el];

  const listNode = el.content.find(
    (n) => n?.type === "bulleted-list" || n?.type === "numbered-list"
  );
  if (!listNode?.children?.length) return [el];

  const items = listNode.children.filter(
    (c) => c?.type === "list-item" || c?.text !== undefined
  );
  if (items.length < 4) return [el];

  const mid = Math.ceil(items.length / 2);
  const listType = listNode.type;

  const makeList = (slice) => ({
    ...el,
    content: [
      {
        type: listType,
        children: slice,
      },
    ],
  });

  return [makeList(items.slice(0, mid)), makeList(items.slice(mid))];
};

export const splitListIntoChunks = (el, chunkCount, perChunk) => {
  if (!el?.content || !Array.isArray(el.content)) return [el];

  const listNode = el.content.find(
    (n) => n?.type === "bulleted-list" || n?.type === "numbered-list"
  );
  if (!listNode?.children?.length) return [el];

  const items = listNode.children.filter(
    (c) => c?.type === "list-item" || c?.text !== undefined
  );
  const listType = listNode.type;
  const out = [];

  for (let i = 0; i < chunkCount; i++) {
    const slice = items.slice(i * perChunk, (i + 1) * perChunk);
    if (slice.length === 0) continue;
    out.push({
      ...el,
      content: [{ type: listType, children: slice }],
    });
  }

  return out.length ? out : [el];
};

/**
 * Before layout: split large lists on text-only slides so layout engine can place columns.
 */
export const expandElementsForTextOnlySlide = (
  elements,
  meta = {},
  slideIndex = -1,
  slideCount = 0
) => {
  if (!isTextOnlySlide(meta, slideIndex, slideCount)) return elements;

  const density = normDensity(meta);
  const out = [];
  const listEls = [];
  const nonLists = [];

  for (const el of elements) {
    if (isListElement(el)) listEls.push(el);
    else nonLists.push(el);
  }

  if (density === "high") {
    const totalItems = listEls.reduce(
      (n, el) => n + countListItems(el.content),
      0
    );
    if (listEls.length === 1 && totalItems >= 8) {
      out.push(...splitListIntoChunks(listEls[0], 4, 5));
    } else if (listEls.length === 1 && totalItems >= 3) {
      out.push(...splitListElementInHalf(listEls[0]));
    } else if (listEls.length === 2 && totalItems >= 8) {
      listEls.forEach((el) => {
        const n = countListItems(el.content);
        if (n >= 6) out.push(...splitListElementInHalf(el));
        else out.push(el);
      });
    } else {
      listEls.forEach((el) => {
        const n = countListItems(el.content);
        if (n >= 4) out.push(...splitListElementInHalf(el));
        else out.push(el);
      });
    }
    return [...nonLists, ...out];
  }

  if (density === "medium") {
    const totalItems = listEls.reduce(
      (n, el) => n + countListItems(el.content),
      0
    );
    if (listEls.length === 1 && totalItems >= 6) {
      out.push(...splitListIntoChunks(listEls[0], 3, 5));
    } else {
      listEls.forEach((el) => {
        const n = countListItems(el.content);
        if (n >= 5) out.push(...splitListElementInHalf(el));
        else out.push(el);
      });
    }
    return [...nonLists, ...out];
  }

  for (const el of elements) {
    if (!isListElement(el)) {
      out.push(el);
      continue;
    }
    const n = countListItems(el.content);
    if (n >= 5) {
      out.push(...splitListElementInHalf(el));
    } else {
      out.push(el);
    }
  }

  const listCount = out.filter((e) => isListElement(e)).length;
  if (density === "medium" && listCount === 1) {
    const onlyList = out.find((e) => isListElement(e));
    if (onlyList && countListItems(onlyList.content) >= 6) {
      const idx = out.indexOf(onlyList);
      out.splice(idx, 1, ...splitListElementInHalf(onlyList));
    }
  }

  return out;
};

export const pickTextOnlyTemplate = (meta, slideIndex, slideCount = 0) => {
  if (!isTextOnlySlide(meta, slideIndex, slideCount)) return null;
  const density = normDensity(meta);
  if (density === "high") return "text-focus-dense";
  if (density === "medium") return "text-focus-dense";
  return "text-focus";
};

