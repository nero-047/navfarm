'use client';

import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompanyMeta } from '../types';

export function CompanyCard({ company }: { company: CompanyMeta }) {
  return (
    <Link href={`/${company.slug}/dashboard`}>
      <Card className="transition-all hover:shadow-lg hover:border-[#c24332] cursor-pointer h-full">
        <CardHeader>
          <span className="text-4xl mb-2">{company.icon}</span>
          <CardTitle className="text-lg">{company.name}</CardTitle>
          <CardDescription>{company.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
