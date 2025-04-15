import { icons } from 'lucide-solid';
import { BarList } from '~/components/ui/bar-list';
import { Card } from '~/components/ui/card';

export function BarListDemo() {
  const data = [
    {
      name: 'Twitter',
      value: 456,
      href: 'https://twitter.com/tremorlabs',
      icon: icons.Github,
    },
    {
      name: 'Google',
      value: 351,
      href: 'https://google.com',
      icon: icons.Github,
    },
    {
      name: 'GitHub',
      value: 271,
      href: 'https://github.com/tremorlabs/tremor',
      icon: icons.Github,
    },
    {
      name: 'Reddit',
      value: 191,
      href: 'https://reddit.com',
      icon: icons.Github,
    },
    {
      name: 'Youtube',
      value: 91,
      href: 'https://www.youtube.com/@tremorlabs3079',
      icon: icons.Youtube,
    },
  ];
  return (
    <Card class="mx-auto w-96 p-5">
      <h3 class="font-medium">Website Analytics</h3>
      <p class="mt-4 flex items-center justify-between text-muted-foreground">
        <span>Source</span>
        <span>Views</span>
      </p>
      <BarList data={data} class="mt-2" />
    </Card>
  );
}
