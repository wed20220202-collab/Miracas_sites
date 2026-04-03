const ADMIN_EMAILS = new Set([
  "vga29-pc250033@sankogakuen.jp",
  "vga29-pc250006@sankogakuen.jp",
  "vga29-pc250029@sankogakuen.jp",
  "12210295@sankogakuen.jp",
  "12010311@sankogakuen.jp",
  "kousei10160926@gmail.com",
  "sohuta0810@gmail.com"
]);

export function isAdmin(email){
  return ADMIN_EMAILS.has(email);
}