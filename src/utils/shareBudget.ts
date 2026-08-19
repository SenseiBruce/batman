import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import html2canvas from 'html2canvas';

export async function shareBudgetImage(
  element: HTMLElement,
  selectedMonth: string,
  monthLabel: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#111827',
    scale: 2,
    ignoreElements: (el) => el.classList.contains('no-capture'),
  });

  const base64 = canvas.toDataURL('image/png');
  const fileName = `budget-${selectedMonth}-${Date.now()}.png`;

  const result = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  });

  await Share.share({
    title: `Budget - ${monthLabel}`,
    text: `Here is my budget summary for ${monthLabel}`,
    url: result.uri,
    dialogTitle: 'Save or Share Budget',
  });
}
