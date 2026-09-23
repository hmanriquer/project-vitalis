export type MailMessage = {
  to: string;
  subject: string;
  html: string;
};

export type MailPort = {
  send(message: MailMessage): Promise<void>;
};
