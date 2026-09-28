'use client';

export function PrintButton() {
 return <button className="primary" type="button" onClick={() => window.print()}>Print / save as PDF</button>;
}
