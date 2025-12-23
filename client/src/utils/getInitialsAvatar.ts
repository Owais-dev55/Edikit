export const getInitialsAvatar = (fullName: string) => {
  if (!fullName) return "U"; // fallback
  const names = fullName.trim().split(" ");
  const initials =
    names.length === 1
      ? names[0][0]
      : names[0][0] + names[names.length - 1][0];
  return initials.toUpperCase();
};
