export function getEnv(context) {
  return {
    FAMILY_URL: Netlify.env.get('URL') ?? 'https://poap.family',
    FAMILY_API_URL: Netlify.env.get('REACT_APP_FAMILY_API_URL') ?? 'https://api.poap.family',
    FAMILY_API_KEY: Netlify.env.get('REACT_APP_FAMILY_API_KEY'),
    COMPASS_URL: Netlify.env.get('REACT_APP_COMPASS_URL') ?? 'https://public.compass.poap.tech/v1/graphql',
    COMPASS_KEY: Netlify.env.get('REACT_APP_COMPASS_KEY'),
  }
}
