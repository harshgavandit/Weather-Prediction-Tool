import { SurveyRecord } from '../types';

export interface IllustrativeImageSource {
  id: string;
  theme: string;
  title: string;
  imageUrl: string;
  sourceUrl: string;
  credit: string;
  license: string;
  alt: string;
}

export interface ParticipantIllustration {
  participantId: string;
  participantLabel: string;
  rowNumber: number;
  problem: string;
  preferredAction: string;
  image: IllustrativeImageSource;
}

const unsplashParams = '?auto=format&fit=crop&w=1400&q=82';

export const illustrativeImageSources: Record<string, IllustrativeImageSource> = {
  forest: {
    id: 'forest',
    theme: 'Heat & green cover',
    title: 'Urban shade and healthy tree canopy',
    imageUrl: `https://images.unsplash.com/photo-1645291884781-f27a8a1ec3a5${unsplashParams}`,
    sourceUrl: 'https://unsplash.com/photos/51MmWR5I4_4',
    credit: 'Robert Grunder · Unsplash',
    license: 'Unsplash License',
    alt: 'View looking upward through a green forest canopy'
  },
  flood: {
    id: 'flood',
    theme: 'Flooding & mobility',
    title: 'Urban waterlogging and disrupted access',
    imageUrl: `https://images.unsplash.com/photo-1661868678536-700da1f5e7fb${unsplashParams}`,
    sourceUrl: 'https://unsplash.com/photos/KbG3OsDKkCM',
    credit: 'Dibakar Roy · Unsplash',
    license: 'Unsplash License',
    alt: 'People carefully crossing a waterlogged urban street'
  },
  drought: {
    id: 'drought',
    theme: 'Water shortage',
    title: 'Water stress and dry-ground conditions',
    imageUrl: `https://images.unsplash.com/photo-1617245943848-2e7b36c6d269${unsplashParams}`,
    sourceUrl: 'https://unsplash.com/photos/vJ9RJJUf0Ws',
    credit: 'Nikola Tomašić · Unsplash',
    license: 'Unsplash License',
    alt: 'Close view of dry and deeply cracked earth'
  },
  irrigation: {
    id: 'irrigation',
    theme: 'Water & agriculture',
    title: 'Efficient irrigation and crop resilience',
    imageUrl: `https://images.unsplash.com/photo-1645727527942-f12e14a0c841${unsplashParams}`,
    sourceUrl: 'https://unsplash.com/photos/ztHHjV0t0Qw',
    credit: 'Elibet Valencia Muñoz · Unsplash',
    license: 'Unsplash License',
    alt: 'Sprinklers irrigating neat rows of green crops'
  },
  solar: {
    id: 'solar',
    theme: 'Renewable energy',
    title: 'Clean-energy infrastructure',
    imageUrl: `https://images.unsplash.com/photo-1509389928833-fe62aef36deb${unsplashParams}`,
    sourceUrl: 'https://unsplash.com/photos/fm5_vCUa-Bc',
    credit: 'American Public Power Association · Unsplash',
    license: 'Unsplash License',
    alt: 'Large field of blue photovoltaic solar panels'
  },
  air: {
    id: 'air',
    theme: 'Air quality',
    title: 'Urban haze and clean-air action',
    imageUrl: `https://images.unsplash.com/photo-1544103381-d15253f7a428${unsplashParams}`,
    sourceUrl: 'https://unsplash.com/photos/kRH6uaBdkJA',
    credit: 'Alin Gavriliuc · Unsplash',
    license: 'Unsplash License',
    alt: 'City skyline partly hidden by dense atmospheric haze'
  },
  recycling: {
    id: 'recycling',
    theme: 'Waste management',
    title: 'Visible waste sorting and recycling',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Colorful_Recycling_Containers_for_Trash.jpg/1280px-Colorful_Recycling_Containers_for_Trash.jpg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Colorful_Recycling_Containers_for_Trash.jpg',
    credit: 'epSos.de · Wikimedia Commons',
    license: 'Creative Commons source',
    alt: 'Color-coded containers for separating recyclable waste'
  }
};

export const illustrativeFallbackUrl = illustrativeImageSources.forest.imageUrl;

function chooseIllustration(record: SurveyRecord): IllustrativeImageSource {
  const problem = record.answers.Q14;
  const action = record.answers.Q15;

  if (action === 'Renewable Energy') return illustrativeImageSources.solar;
  if (action === 'Waste Management') return illustrativeImageSources.recycling;
  if (problem === 'Flooding') return illustrativeImageSources.flood;
  if (problem === 'Air Pollution') return illustrativeImageSources.air;
  if (problem === 'Water Shortage') return record.rowNumber % 2 === 0 ? illustrativeImageSources.irrigation : illustrativeImageSources.drought;
  if (problem === 'Rainfall changes') return illustrativeImageSources.irrigation;
  if (problem === 'Heat' || action === 'Tree Plantation') return illustrativeImageSources.forest;
  if (action === 'Water Conservation') return illustrativeImageSources.irrigation;
  return illustrativeImageSources.forest;
}

export function getIllustrativeImageForRecord(record: SurveyRecord): ParticipantIllustration {
  return {
    participantId: record.id,
    participantLabel: record.respondentId,
    rowNumber: record.rowNumber,
    problem: record.answers.Q14 || 'Not specified',
    preferredAction: record.answers.Q15 || 'Not specified',
    image: chooseIllustration(record)
  };
}

export function buildParticipantIllustrations(records: SurveyRecord[]): ParticipantIllustration[] {
  return records.map(getIllustrativeImageForRecord);
}
