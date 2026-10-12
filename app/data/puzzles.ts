export type DailyPuzzle = {
  date: string
  title: string
  note: string
  imageName: string
  imageSlug: string
  imageUrl: string
  size: number
}

// La programmation est volontairement éditoriale : ajoutez chaque journée ici.
// Les variantes publiques viennent de l’API Zimablue et ne nécessitent pas de clé.
export const dailyPuzzles: DailyPuzzle[] = [
  {
    date: '2026-10-12',
    title: 'Soleil Pour Deux',
    note: 'Viens, je t’emmène dans mon paradis bleu.',
    imageName: 'Soleil Pour Deux',
    imageSlug: 'soleil-deuxjpg-ml6qmt92b8s',
    imageUrl: 'https://zimablue.cc/images/soleil-deux-ml6qmgipvcj.jpeg/md.jpeg',
    size: 3,
  },
  {
    date: '2026-10-11',
    title: 'Biscotte Paper Plane',
    note: 'Biscotte prend son envol.',
    imageName: 'Biscotte Paper Plane',
    imageSlug: 'breakfastclub-biscottepaperplanejpg-mjz3hk0vnxf',
    imageUrl: 'https://zimablue.cc/images/breakfastclub-biscottepaperplane-mjz3hegxw1u.jpeg/md.jpeg',
    size: 3,
  },
  {
    date: '2026-10-10',
    title: 'Astronaute',
    note: 'Une petite escapade dans l’espace.',
    imageName: 'Astronaute',
    imageSlug: 'astronautejpg-mbkxy9n0pl6',
    imageUrl: 'https://zimablue.cc/images/astronaute-mbkxy5vj0kr.jpeg/md.jpeg',
    size: 3,
  },
]

export const today = dailyPuzzles[0]!

export function getPuzzle(date: string) {
  return dailyPuzzles.find(puzzle => puzzle.date === date)
}

export function formatPuzzleDate(date: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'full' }) {
  return new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: 'Europe/Paris' })
    .format(new Date(`${date}T12:00:00+02:00`))
}
