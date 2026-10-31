import Svg, { Path } from "react-native-svg";

/* Line icons in the web app's style: 24px grid, 1.8 stroke, round caps. */
const P: Record<string, string[]> = {
  today: ["M4 11.5 12 5l8 6.5", "M6 10v9h12v-9", "M10 19v-5h4v5"],
  heart: ["M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"],
  road: ["M8 21 10.5 3", "M16 21 13.5 3", "M12 7v2", "M12 12v2", "M12 17v2"],
  spark: ["M12 3v4", "M12 17v4", "M3 12h4", "M17 12h4", "M6 6l2.5 2.5", "M15.5 15.5 18 18", "M18 6l-2.5 2.5", "M8.5 15.5 6 18"],
  chat: ["M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"],
  users: ["M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z", "M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5", "M16 4.5a3.5 3.5 0 0 1 0 6.5", "M18 14.8c2 .6 3.2 2.3 3.5 5.2"],
  settings: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.5 7.5 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 2.6-1.5l2.4 1 2-3.4Z"],
  phone: ["M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5L16 14l4 1.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4Z"],
  alert: ["M12 4 2.8 19.5h18.4Z", "M12 10v4.5", "M12 17.2v.3"],
  shield: ["M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6Z", "M9 12l2 2 4-4"],
  check: ["M5 12.5 10 17.5 19 7"],
  chevron: ["M9 5l7 7-7 7"],
  chevronDown: ["M5 9l7 7 7-7"],
  arrowR: ["M4 12h15", "M13 6l6 6-6 6"],
  back: ["M15 5l-7 7 7 7"],
  calendar: ["M4 6.5h16V20H4Z", "M4 10.5h16", "M8 3.5v5", "M16 3.5v5"],
  flag: ["M5 21V4", "M5 4h11l-2 4 2 4H5"],
  flame: ["M12 21c3.9 0 6.5-2.6 6.5-6.2 0-4.3-4-6.6-4.6-10.8-2.4 1.7-3.6 4-3.4 6.4-1-.6-1.7-1.6-2-2.9C6.9 9.2 5.5 11.4 5.5 14.6 5.5 18.4 8.1 21 12 21Z"],
  pill: ["M10.5 20.5a5 5 0 0 1-7-7l6.9-7a5 5 0 0 1 7 7Z", "M7 10l7 7"],
  walk: ["M13 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z", "M9 21l2.5-6.5L14 17v4", "M8 12l2-4.5 3 .5 2 3 3 1", "M11.5 14.5 10 8"],
  care: ["M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z", "M9.5 12h5", "M12 9.5v5"],
  music: ["M9 18V6l11-2v12", "M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z", "M20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z"],
  film: ["M4 5h16v14H4Z", "M8 5v14", "M16 5v14", "M4 9.5h4", "M4 14.5h4", "M16 9.5h4", "M16 14.5h4"],
  book: ["M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z", "M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"],
  food: ["M6 3v8a2 2 0 0 0 2 2v8", "M10 3v8a2 2 0 0 1-2 2", "M8 3v6", "M17 21V3c-2 1.5-3 4-3 7 0 1.7 1.3 3 3 3"],
  map: ["M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z", "M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"],
  plus: ["M12 5v14", "M5 12h14"],
  logout: ["M14 4h5v16h-5", "M10 8l-4 4 4 4", "M6 12h10"],
  download: ["M12 4v11", "M7 10.5 12 15.5 17 10.5", "M5 20h14"],
  trash: ["M4 7h16", "M9 7V4h6v3", "M6.5 7l1 13h9l1-13"],
  bell: ["M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z", "M10 20.5a2 2 0 0 0 4 0"],
  key: ["M14.5 9.5a4.5 4.5 0 1 0-1.3 3.2L21 20.5", "M17 16.5l2-2", "M19 18.5l1.5-1.5"],
  send: ["M4 12 20 4l-6 16-3-7Z", "M11 13l9-9"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7v5l3 2"],
  info: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 11v5", "M12 8v.3"],
};
export type IconName = keyof typeof P;

export function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.8 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {P[name].map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </Svg>
  );
}
