// Central image base. Assets are self-hosted under public/assets (mirrored from
// the original domain), so images load from this origin — no external dependency.
export const IMG_BASE = "/assets/img";

export const img = (path) => `${IMG_BASE}/${path.replace(/^\/+/, "")}`;
