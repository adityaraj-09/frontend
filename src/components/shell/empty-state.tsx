export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[22px] font-bold text-[#1b1b1b]">{title}</h1>
      <p className="mt-2 text-[14px] font-medium leading-6 text-[#404040]">{body}</p>
    </div>
  );
}
