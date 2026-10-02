# TASKS

Implementa le seguenti carte. Dagli nomi azzeccati. Assegna tu la classe in base all'identità e la rarità in base alla potenza:

- [ ] Carta "Masochista": ottieni horns e fai hurryEnemy per Xs.

- [ ] Nuova carta Voodoo Pin: (ha esaurisci) pietrifica X tue carte casuali nel mazzo e da a loro -1 di costo (per questo combattimento).

- [ ] NUova carta del mago che non fa decadere la passiva multitasking per X sec.

- [ ] Nuova carta che per X sec ti da doppia rigenerazione mana, ma ti da anche blackout.

- [ ] Nuova Carta attacco che fa parecchi danni, ad ogni uso si riduce di -X.

- [ ] Nuova carta mago: ti curi per ogni carica di multitasking del nemico, esaurisci.

- [ ] Nuova carta mago: perdi 5 hp, per i prossimi 5sec ottieni 1 carica di multitasking al secondo.

- [ ] Nuova carta con costo variabile X per il mago: aggiunge 5 chill per il costo X.

- [ ] Nuova carta con costo variabile X per il necro: applichi tot weak per il costo X.

- [ ] Nuova carta guerriero "Stop the Line": ti da tanto block ma ferma il nastro per tot secondi.

- [ ] NUova carta necro, potere: ogni volta che applichi veleno, applichi anche 1 chill

- [x] Nuova carta Safety Drill: gioca gratis tutte le carte defense sul nastro. playBelt(type) accetta già qualsiasi tipo di carta, quindi non serve codice nuovo.

- [x] Carta analoga a Mr Robot ma difensiva "Roomba": stesso trascinamento, ma ogni carta spazzata dà +Block, fino a un tetto. Il campo sweep aggiunge al valore indicato da bonusIdx, da verificare che regga anche un valore di Block.

- [ ] Carta analogca a Quiet quitting ma difensiva "Cleaning Out the Desk": esaurisce tutto il nastro, regen per ogni carta. Il danno ha già la forma hits: c.exhaustBelt().

- [x] Carta analogca a complaint box ma difensiva "Suggestion Box": il Block cresce mentre il mana trabocca. Usa onOverflow e fa coppia di nome con l'originale.

- [ ] Carta analoga a Stonks ma difensiva "Index Fund": Block, e +Block a ogni giocata per il resto del fight. Usa bonus, che esiste già.

- [ ] carta analoga a Just cause ma difensiva "Hardship Case": Block maggiore se HP sotto soglia ({$name} da VALUES).

- [x] Carta "Brace for Impact": Danno, danno maggiore se NON hai blocco.

- [x] Carta con nome creativo, che da blocco e applica stun breve.

- [x] Carta Step 1 che aggiunge al mazzo Step 2, così via fino a Step 4 che ti da tanta regen + horns + altro.

- [x] Carta "Credit Card": Block 30 subito, ma perdi 15hp e mischi nel mazzo la curse Debt, che esiste già. 


# NEXT STEPS (ignore for now):

> aggiungere uso della paga

> URL. Il sito vive su liverstone- [ ] [ ]plus: per il lancio servono un nome coerente (itch.io/punchcard o un dominio) e un'immagine og aggiornata.


# IDEE

... Nemico con mossa di Stun + autoplay: ti stunna e la belt continua a scorrere con Autopilot forzato. Per 8s non puoi scegliere nulla, ma le carte che passano si giocano da sole. È una mossa di rischio/beneficio in base al tuo mazzo.

... dodge sui nemici: un nemico con mossa "No accountability" che schiva per Xs.

... un nemico con tantissimo blocco e pochi HP
