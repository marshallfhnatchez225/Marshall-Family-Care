'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="content workflow"><section className="workflow-card"><h1>We couldn’t load this page.</h1><p>Your saved information is unchanged. Please try again.</p><button className="primary" onClick={reset}>Try again</button></section></main>;}
