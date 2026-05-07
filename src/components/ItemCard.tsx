'use client';

type Props = {
  name: string;
  count: number;
  onUpdate: (name: string, delta: number) => void;
};

export function ItemCard({ name, count, onUpdate }: Props) {
  return (
    <div className="flex flex-col justify-between p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm dark:bg-zinc-800 dark:border-zinc-700 aspect-square">
      <div className="text-center font-medium text-zinc-900 dark:text-zinc-100 py-2">
        {name}
      </div>
      <div className="flex items-center justify-between bg-zinc-50 rounded-full p-1 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => onUpdate(name, -1)}
          className="w-8 h-8 flex items-center justify-center rounded-full active:bg-zinc-200 dark:active:bg-zinc-700"
        >
          －
        </button>
        <span className="font-bold text-lg">{count}</span>
        <button
          type="button"
          onClick={() => onUpdate(name, 1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black"
        >
          ＋
        </button>
      </div>
    </div>
  );
}
