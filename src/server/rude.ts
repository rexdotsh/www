import {
  englishDataset,
  englishRecommendedTransformers,
  RegExpMatcher,
} from "obscenity";

const profanity = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const PUNCTUATION_RE = /[^\p{L}\p{N}\s]/gu;

export const isRude = (text: string) =>
  profanity.hasMatch(text) ||
  profanity.hasMatch(text.replace(PUNCTUATION_RE, ""));
