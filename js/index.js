import readline from 'readline';
import fetchLaForetinfo from './laforet.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Veuillez entrer le nom de la ville pour la recherche : ', async (city) => {
  try {
    const laforetInfo = await fetchLaForetinfo(city);
    console.log(laforetInfo);
    console.log('Vous avez récupéré ' + laforetInfo.length + " biens a " + city);
  } catch (error) {
    console.error('Erreur lors de la récupération des informations :', error);
  }

  rl.close(); 
});


