export async function POST(request: Request) {
  const body = await request.json();

  const result = await signUpUser(body);

  return Response.json(result, { status: 201 });
}