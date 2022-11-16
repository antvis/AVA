import { transformHtml } from "./transformHtml";

/**
 * put data to clipboard using execCommand api
 * @param htmlStr the html string to be put into clipboard
 * @param plainText the plain text to be put into clipboard
 * @param onSuccess function to be called when the copy succeed
 * @param onError function to be called when the copy fail
 */
const execCopyCommand = (
  htmlStr: string,
  plainText?: string,
  onSuccess?: () => void,
  onError?: () => void,
) => {
  const listener = (e: ClipboardEvent) => {
    try {
      e.clipboardData?.setData('text/html', htmlStr);
      e.clipboardData?.setData('text/plain', plainText || htmlStr);
      e.preventDefault();
      onSuccess?.()
    } catch (err) {
      onError?.()
    }
  };
  document.addEventListener('copy', listener);
  document.execCommand('copy');
  document.removeEventListener('copy', listener);
};

export const copyToClipboard = (
  htmlString: string,
  plainText?: string,
  onSuccess?: () => void,
  onError?: () => void,
) => {
  try {
    const html = new Blob([htmlString], { type: 'text/html' });
    const text = new Blob([plainText || htmlString], { type: 'text/plain' });
    const dataForCopy = [
      new window.ClipboardItem({
        'text/html': html,
        'text/plain': text,
      }),
    ];
    navigator.clipboard.write(dataForCopy).then(() => {
      onSuccess?.();
    });
  } catch (err) {
    /** use the execCommand api as the fallback, in case that ClipboardItem is not available*/
    execCopyCommand(htmlString, plainText, onSuccess, onError);
  }
};

export const getSelectionContentForCopy = async () => {
  // get the html string of selection
  const doms = window.getSelection()?.getRangeAt(0).cloneContents();
  const container = document.createElement('div');
  if (doms) {
    container.appendChild(doms);
  }
  const plainText = container.innerText;
  const transformedHtml = await transformHtml({elements: [container]});
  return {
    plainText: plainText,
    html: transformedHtml
  }
};
