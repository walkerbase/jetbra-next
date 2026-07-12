'use client';

import { useStore } from '@nanostores/react';
import {
  CalendarDays,
  Check,
  Copy,
  FileText,
  Hash,
  LoaderCircle,
  Pencil,
  Search,
  SquareArrowOutUpRight,
  UserRound,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getProductCodes } from '@/lib/helper';
import { cn } from '@/lib/utils';
import {
  $filteredProducts,
  $loading,
  $products,
  $profile,
  $query,
  $selectedCodes,
  type Product,
  toggleProduct,
} from '@/stores/license-store';
import { ScrollArea } from './ui/scroll-area';

export function LicenseConsole() {
  const profile = useStore($profile);
  const products = useStore($products);
  const filtered = useStore($filteredProducts);
  const selected = useStore($selectedCodes);
  const loading = useStore($loading);
  const query = useStore($query);

  const [result, setResult] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('license-demo-profile');

    if (saved) {
      $profile.set(JSON.parse(saved));
    }

    fetch('/api/apps')
      .then(async (response) => {
        const result = await response.json();

        if (
          !response.ok ||
          result.code !== 200 ||
          !Array.isArray(result.data)
        ) {
          throw new Error(result.message ?? '应用列表加载失败');
        }

        return result.data;
      })
      .then((data: Product[]) => {
        $products.set(data);
        $selectedCodes.set([
          ...new Set(data.flatMap((product) => product.code)),
        ]);
      })
      .catch((error) => {
        console.error(error);
        $products.set([]);
        $selectedCodes.set([]);
      })
      .finally(() => {
        $loading.set(false);
      });
  }, []);

  const selectedProducts = useMemo(
    () =>
      products.filter((product) =>
        getProductCodes(product).some((code) => selected.includes(code)),
      ),
    [products, selected],
  );

  function saveProfile(next: typeof profile) {
    $profile.set(next);
    localStorage.setItem('license-demo-profile', JSON.stringify(next));
  }

  async function generate() {
    setGenerating(true);

    try {
      const response = await fetch('/api/generate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseeName: profile.licenseeName,
          assigneeName: profile.assigneeName,
          assigneeEmail: profile.assigneeEmail,
          checkConcurrentUse: false,
          metadata: '0120230102PPAA013009',
          hash: '41472961/0:1563609451',
          gracePeriodDays: 7,
          autoProlongated: true,
          isAutoProlongated: true,
          products: selectedProducts.flatMap((item) =>
            getProductCodes(item).map((code) => ({
              code,
              fallbackDate: profile.expiryDate,
              paidUpTo: profile.expiryDate,
            })),
          ),
        }),
      });
      const data = await response.json();

      setResult(data.license);
      setDialogOpen(true);
    } finally {
      setGenerating(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="min-h-screen bg-[#17191b] text-zinc-200">
      <header className="flex h-[70px] items-center justify-between border-b border-white/8 bg-[#202224] px-5 md:px-8">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-[10px] bg-linear-to-br from-fuchsia-500 via-rose-500 to-orange-500 text-lg font-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
            J
          </div>
          <span className="text-[22px] font-semibold tracking-[-0.02em]">
            JetBrains License
          </span>
        </div>

        <a
          className="flex items-center gap-2 text-[15px] text-[#8fc2ff] transition-colors hover:text-[#afd4ff] focus:outline-none focus-visible:outline-none"
          href="https://www.jetbrains.com/store/"
          target="_blank"
          rel="noreferrer"
        >
          <FileText className="size-[18px]" />
          官方商店
          <SquareArrowOutUpRight className="size-[18px]" />
        </a>
      </header>

      <section className="mx-auto max-w-[1180px] px-4 py-8 md:px-8">
        <h1 className="mb-7 flex items-center gap-4 text-[20px] font-semibold tracking-[-0.01em]">
          <Pencil className="size-[22px]" />
          填写信息并生成激活码
        </h1>

        <div className="grid gap-4 md:grid-cols-2 md:gap-x-5">
          <Field icon={<Hash />} label="姓名">
            <Input
              value={profile.licenseeName}
              onChange={(event) =>
                saveProfile({
                  ...profile,
                  licenseeName: event.target.value,
                })
              }
            />
          </Field>

          <Field icon={<UserRound />} label="用户名">
            <Input
              value={profile.assigneeName}
              onChange={(event) =>
                saveProfile({
                  ...profile,
                  assigneeName: event.target.value,
                })
              }
            />
          </Field>

          <Field icon={<FileText />} label="邮箱">
            <Input
              type="email"
              value={profile.assigneeEmail}
              onChange={(event) =>
                saveProfile({
                  ...profile,
                  assigneeEmail: event.target.value,
                })
              }
            />
          </Field>

          <Field icon={<CalendarDays />} label="到期时间">
            <Input
              type="date"
              value={profile.expiryDate}
              className="dark:[&::-webkit-calendar-picker-indicator]:invert"
              onChange={(event) =>
                saveProfile({
                  ...profile,
                  expiryDate: event.target.value,
                })
              }
            />
          </Field>
        </div>

        <p className="mb-3 mt-5 text-[14px] text-zinc-400">已选择的应用</p>

        <ScrollArea className="h-36 w-full rounded-lg border border-white/10 bg-[#181a1c]">
          <div className="flex flex-wrap gap-1.5 p-4 pr-6">
            {selectedProducts.map((product) => (
              <div
                key={product.name}
                className="flex items-center gap-1.5 rounded-2xl bg-[#25282b] px-2.5 py-1 text-[12px] leading-none text-zinc-200"
              >
                {/* biome-ignore lint/performance/noImgElement: 商品图标来自动态外部地址 */}
                <img src={product.icon} alt="" className="size-4" />
                <span>{product.name}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="relative mt-5 overflow-hidden rounded-sm bg-[#37393c] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-zinc-500/70 focus-within:after:h-0.5 focus-within:after:bg-blue-500 after:transition-all">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[22px] -translate-y-1/2 text-zinc-400" />
          <Input
            className="h-[60px] border-0 bg-transparent pl-14 pr-4 text-[16px] shadow-none ring-0 placeholder:text-zinc-400 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            placeholder="搜索应用/插件（按名称或描述）"
            value={query}
            onChange={(event) => $query.set(event.target.value)}
          />
        </div>

        <div className="flex gap-10 px-5 py-5 text-[14px] text-[#8fc2ff]">
          <button
            type="button"
            className="transition-colors hover:text-[#afd4ff] focus:outline-none focus-visible:outline-none"
            onClick={() =>
              $selectedCodes.set([
                ...new Set([
                  ...selected,
                  ...filtered.flatMap((item) => item.code),
                ]),
              ])
            }
          >
            全选
          </button>

          <button
            type="button"
            className="transition-colors hover:text-[#afd4ff] focus:outline-none focus-visible:outline-none"
            onClick={() => $selectedCodes.set([])}
          >
            全不选
          </button>
        </div>

        <ScrollArea className="h-[375px] overflow-y-auto rounded-lg border border-white/10 bg-[#181a1c]">
          {loading ? (
            <div className="grid h-[375px] place-items-center">
              <LoaderCircle className="size-7 animate-spin text-zinc-400" />
            </div>
          ) : (
            filtered.map((product) => {
              const checked = selected.includes(product.code);

              return (
                <Label
                  key={product.name}
                  className="flex min-h-[62px] cursor-pointer items-center gap-5 px-5 py-2 transition-colors hover:bg-white/4.5"
                >
                  <Checkbox
                    checked={checked}
                    className="size-5 rounded-[3px] border-zinc-500 bg-transparent shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 data-[state=checked]:border-[#8fc2ff] data-[state=checked]:bg-[#8fc2ff] data-[state=checked]:text-[#15202b]"
                    onCheckedChange={(value) =>
                      toggleProduct(product, value === true)
                    }
                  />
                  {/* biome-ignore lint/performance/noImgElement: 商品图标来自动态外部地址，保留原生 img 标签 */}
                  <img src={product.icon} alt="" className="size-8 shrink-0" />

                  <span className="min-w-0">
                    <strong className="block truncate text-[14px] font-medium leading-6 text-zinc-200">
                      {product.name}
                    </strong>
                    <small className="block truncate text-[12px] leading-5 text-zinc-500">
                      {product.description}
                    </small>
                  </span>
                </Label>
              );
            })
          )}
        </ScrollArea>

        <div className="sticky bottom-12 flex justify-end">
          <Button
            className="h-11 rounded-full bg-[#8fc2ff] px-4 text-[16px] font-medium text-[#17202a] shadow-none hover:bg-[#a9d0ff] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            disabled={!selected.length || generating}
            onClick={generate}
          >
            {generating ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Check className="size-5" />
            )}
            生成激活码
          </Button>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="z-100 max-w-xl overflow-hidden rounded-lg border border-white/10 bg-[#202224] p-0 text-zinc-100 shadow-2xl outline-none focus:outline-none focus-visible:outline-none sm:rounded-lg [&>button]:focus:outline-none [&>button]:focus-visible:outline-none [&>button]:focus-visible:ring-0">
          <DialogHeader className="border-b border-white/8 px-6 py-5">
            <DialogTitle className="text-lg font-semibold text-zinc-100">
              已生成
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-zinc-400">
              复制即可使用
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 pb-6">
            <textarea
              readOnly
              value={result}
              className="mt-5 h-44 w-full resize-none break-all rounded-lg border-0 bg-[#151719] p-4 font-mono text-xs leading-5 text-zinc-300 shadow-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
            />

            <Button
              className="h-11 w-full bg-[#8fc2ff] text-[#17202a] shadow-none hover:bg-[#a9d0ff] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              onClick={copy}
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? '已复制' : '复制激活码'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Field({
  icon,
  label,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-sm bg-[#37393c] pl-[54px] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-zinc-500/70 focus-within:after:h-0.5 focus-within:after:bg-[#8fc2ff]',
        className,
      )}
    >
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 [&>svg]:size-[22px]">
        {icon}
      </div>

      <Label className="pointer-events-none absolute left-[54px] top-2 text-[11px] font-normal text-zinc-400">
        {label}
      </Label>

      <div className="[&>input]:h-[60px] [&>input]:border-0 [&>input]:bg-transparent [&>input]:px-0 [&>input]:pb-1 [&>input]:pt-6 [&>input]:text-[17px] [&>input]:text-zinc-100 [&>input]:shadow-none [&>input]:outline-none [&>input]:ring-0 [&>input]:focus:outline-none [&>input]:focus:ring-0 [&>input]:focus-visible:outline-none [&>input]:focus-visible:ring-0">
        {children}
      </div>
    </div>
  );
}
