import twilio from 'twilio';

type TwilioCredentials = {
  accountSid: string;
  authToken: string;
  apiKeySid?: string;
  apiKeySecret?: string;
  twimlAppSid?: string | null;
};

export function createTwilioClient(config: TwilioCredentials) {
  return twilio(config.accountSid, config.authToken, {
    accountSid: config.accountSid,
  });
}
