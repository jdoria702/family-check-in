import { registerSchema } from "./auth-schema";

const testCases = [
  {
    label: "valid input",
    data: {
      name: "Jason Doria",
      email: "JASON@EXAMPLE.COM",
      password: "Password!",
    },
  },
  {
    label: "consecutive spaces",
    data: {
      name: "Jason  Doria",
      email: "jason@example.com",
      password: "Password!",
    },
  },
  {
    label: "invalid email",
    data: {
      name: "Jason Doria",
      email: "jason",
      password: "Password!",
    },
  },
  {
    label: "weak password",
    data: {
      name: "Jason Doria",
      email: "jason@example.com",
      password: "password",
    },
  },
];

for (const testCase of testCases) {
  const result = registerSchema.safeParse(testCase.data);

  console.log(`\n${testCase.label}`);

  if (result.success) {
    console.log("VALID");
    console.log(result.data);
  } else {
    console.log("INVALID");
    console.log(result.error.flatten().fieldErrors);
  }
}