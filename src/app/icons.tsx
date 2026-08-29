import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function IconBase({ title, children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? "img" : undefined} {...props}>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function KnotIcon(props: IconProps) {
  return <IconBase {...props}><path d="M32 9 52 29 32 49 12 29 32 9Z"/><path d="m22 19 20 20M42 19 22 39M32 9v40M12 29h40"/><path d="m19 46 13-13 13 13-13 13-13-13Z"/></IconBase>;
}

export function CloudIcon(props: IconProps) {
  return <IconBase {...props}><path d="M10 34c3-8 12-8 17-4 2-11 18-13 23-3 8-1 12 4 11 10-1 6-6 9-13 9H16c-8 0-11-6-6-12Z"/><path d="M18 38c4-4 8-3 10 1 2-7 12-7 15 0M16 51h34M23 57h27"/></IconBase>;
}

export function CourageIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 50c13-3 18-12 20-27 9 2 16 8 20 18-9-3-17-2-25 5"/><path d="M26 48c6-8 12-12 22-14M14 53c9 2 19 1 28-3"/></IconBase>;
}

export function AbundanceIcon(props: IconProps) {
  return <IconBase {...props}><path d="M32 55V31M32 39c-10 0-17-6-18-16 10-1 17 3 18 16ZM32 31c9 0 16-6 17-16-9-1-16 4-17 16Z"/><path d="M25 55h14M18 17c3-6 9-9 14-9 5 0 11 3 14 9"/></IconBase>;
}

export function JoyIcon(props: IconProps) {
  return <IconBase {...props}><path d="M9 48c13-7 28-8 46-5"/><path d="M22 36c6-11 17-15 27-8-4 1-7 4-8 8-7 4-14 4-19 0Z"/><path d="M42 27c2-6 7-9 12-7l-5 8M24 35 13 27M26 38l-12 2"/><circle cx="47" cy="25" r="1" fill="currentColor" stroke="none"/></IconBase>;
}

export function LongevityIcon(props: IconProps) {
  return <IconBase {...props}><path d="M32 12c-3 7-13 9-17 18-6 13 2 25 17 25s23-12 17-25c-4-9-14-11-17-18Z"/><path d="M32 19c5-7 12-8 18-5-2 7-8 11-17 10M32 22c-2 10-1 20 4 28"/></IconBase>;
}

export function ArrowIcon(props: IconProps) {
  return <IconBase {...props}><path d="M8 32h45M41 18l14 14-14 14"/></IconBase>;
}

export function DownloadIcon(props: IconProps) {
  return <IconBase {...props}><path d="M32 8v34M20 30l12 12 12-12M12 49v7h40v-7"/></IconBase>;
}

export function RestartIcon(props: IconProps) {
  return <IconBase {...props}><path d="M16 17v14h14"/><path d="M17 30a20 20 0 1 0 6-14"/></IconBase>;
}

export function PauseIcon(props: IconProps) {
  return <IconBase {...props}><path d="M23 16v32M41 16v32"/></IconBase>;
}

export function SoundIcon({ muted = false, ...props }: IconProps & { muted?: boolean }) {
  return (
    <IconBase {...props}>
      <path d="M13 27h9l10-9v28L22 37h-9V27Z" />
      {muted ? <path d="m42 26 10 12M52 26 42 38" /> : <><path d="M40 25c4 4 4 10 0 14"/><path d="M47 19c8 8 8 18 0 26"/></>}
    </IconBase>
  );
}
