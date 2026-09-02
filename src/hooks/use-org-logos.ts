'use client';

import { useMemo, useContext } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { FirebaseContext, useCollection, useMemoFirebase } from '@/firebase';
import type { OrganizationProfile } from '@/lib/types';

/**
 * Fetches organization profiles that have a logoUrl set.
 * Used on the homepage carousel to display real team logos.
 * Gracefully returns empty state if Firebase is not yet available.
 */
export function useOrgLogos(maxCount: number = 20) {
  // Use context directly instead of useFirebase() so we don't throw
  // when services aren't yet available (e.g. before client mount).
  const context = useContext(FirebaseContext);
  const firestore = context?.firestore ?? null;

  const orgLogosQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      const colRef = collection(firestore, 'organization_profiles');
      return query(colRef, orderBy('createdAt', 'desc'), limit(maxCount));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firestore, maxCount]
  );

  const { data, isLoading, error } = useCollection<OrganizationProfile>(
    orgLogosQuery ?? undefined
  );

  // Filter client-side to only orgs that have a logoUrl
  const orgLogos = useMemo(
    () => (data ?? []).filter((org) => !!org.logoUrl),
    [data]
  );

  return { orgLogos, isLoading: !firestore || isLoading, error };
}
