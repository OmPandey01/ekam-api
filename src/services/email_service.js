import { Resend } from "resend";

const resend = new Resend("re_AJtFnCFk_85A6UdoDCbXCS5BEZtr8jGGX");

resend.emails.send({
  from: "onboarding@resend.dev",
  to: "mailompandey@gmail.com",
  subject: "Hello World",
  html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
});
