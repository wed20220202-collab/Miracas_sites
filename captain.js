export const captainUsers = [
  //T_Team
  "vga29-pc250088@sankogakuen.jp",
  "vga29-pc250064@sankogakuen.jp",
  "vga29-pc250029@sankogakuen.jp",
  //K_Team
  "vga29-pc250006@sankogakuen.jp",
  "vga29-pc250065@sankogakuen.jp",
  //A_Team
  "vga29-pc250108@sankogakuen.jp",
  "vga29-pc250072@sankogakuen.jp",
  //I_Team
  "vga29-pc250033@sankogakuen.jp",
  "vga29-pc250007@sankogakuen.jp",

  //Teachers
  "12210295@sankogakuen.jp",
  "12010311@sankogakuen.jp",

  //etc
  "kousei10160926@gmail.com",
  "sohuta0810@gmail.com"

];

export function canOpenCaptain(email){
  return captainUsers.includes(email);
}