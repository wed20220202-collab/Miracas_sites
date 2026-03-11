export const captainUsers = [
  "vga29-pc250033@sankogakuen.jp",
  "vga29-pc250006@sankogakuen.jp",
  "vga29-pc250029@sankogakuen.jp"
];

export function canOpenCaptain(email){
  return captainUsers.includes(email);
}