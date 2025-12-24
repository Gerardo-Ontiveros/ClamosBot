export function parseResponse(
  text: string,
  user: string,
  args: string[]
): string {
  let processedText = text;

  processedText = processedText.replace(/\$\(user\)/g, user);

  let targetUser = user;

  if (args.length > 0) {
    targetUser = args[0].replace("@", "");
  }

  processedText = processedText.replace(/\$\(touser\)/g, targetUser);

  while (processedText.includes("$(random)")) {
    const randomNum = Math.floor(Math.random() * 100) + 1;
    processedText = processedText.replace("$(random)", randomNum.toString());
  }

  return processedText;
}
