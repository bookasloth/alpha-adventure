// Central image base. All original site images are referenced from the live domain
// so the rebuild looks identical. Swap this to "/assets/img" if you download assets locally.
export const IMG_BASE = "https://alpha.thegreyhawks.com/assets/img";

export const img = (path) => `${IMG_BASE}/${path.replace(/^\/+/, "")}`;
