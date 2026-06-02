export const manifest = {
  screens: {
    scr_cfwow1: { name: "Home",    route: "/", state: { "view": "home" },    position: { "x": 160,  "y": 220 } },
    scr_g8cjgt: { name: "Preview", route: "/", state: { "view": "preview", "selectedMedia": { "id": "1", "type": "photo", "url": "https://picsum.photos/seed/1/400/600", "name": "IMG_8472.HEIC", "size": "4.2 MB", "date": "Today, 10:42 AM" } }, position: { "x": 1560, "y": 220 } },
    scr_6z9r9w: { name: "History", route: "/", state: { "view": "history" }, position: { "x": 2960, "y": 220 } },
  },
  sections: {
    sec_dfqf9u: { name: "Main workflow", x: 0, y: 0, width: 4160, height: 1180 }
  },
  layers: [
    { kind: "section", id: "sec_dfqf9u", children: [
      { kind: "screen", id: "scr_cfwow1" },
      { kind: "screen", id: "scr_g8cjgt" },
      { kind: "screen", id: "scr_6z9r9w" },
    ]}
  ],
};
