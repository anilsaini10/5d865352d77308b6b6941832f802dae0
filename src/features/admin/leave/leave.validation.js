export const REVIEW_REMARKS_MAX = 500

export function validateReview({ reviewRemarks }) {
  const errors = {}
  if (reviewRemarks.trim().length > REVIEW_REMARKS_MAX) {
    errors.reviewRemarks = `Remarks can be at most ${REVIEW_REMARKS_MAX} characters.`
  }
  return errors
}
