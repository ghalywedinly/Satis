import { splitInline } from "../index";

/** A line of article text. "[[…]]" parts render as isolated left-to-right runs (numbers, formulas, Latin). */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {splitInline(text).map((part, i) =>
        part.ltr ? (
          <bdi key={i} dir="ltr">
            {part.text}
          </bdi>
        ) : (
          part.text
        ),
      )}
    </>
  );
}
