export default function CalendarPage() {
  return (
    <div className="px-5 pt-6 pb-24">
      <h1 className="mb-2 font-serif text-3xl font-bold text-stone-800">
        Lịch Giỗ Lễ
      </h1>
      <div className="mb-8 h-[1px] w-16 bg-amber-500/50" />

      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
        <div className="font-serif text-lg text-stone-700">
          Sắp có
        </div>
        <p className="mt-2 text-sm text-stone-500">
          Lịch âm dương, nhắc giỗ tổ tiên, lễ Tết sẽ được cập nhật ở đây.
        </p>
      </div>
    </div>
  );
}