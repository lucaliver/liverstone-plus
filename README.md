# Liverstone

Deckbuilder roguelike **in tempo reale a nastro trasportatore**, per browser mobile in verticale.
Ispirato a *Cardstone* (Running Pillow, 2015). Stile ufficiale: **colori riso pop + pixel art, un po' dark/scary**.

> Questo file è il documento di gioco: feature, regole, contenuti, direzione artistica e roadmap.
> La parte tecnica (stack, architettura, convenzioni, come aggiungere contenuti) è in [CLAUDE.md](CLAUDE.md).

**Versione:** 1.1 · **Avvio rapido:** `npm install`, poi `npm run dev` (apribile anche dal telefono sulla stessa Wi-Fi).

---

## 1. Il gioco in breve

Scegli un eroe, scendi nella cripta piano per piano. Ogni combattimento è **in tempo reale**: le carte del
mazzo scorrono su un nastro da destra a sinistra e devi giocarle prima che cadano nel buio. Il mana si ricarica
col tempo, il nemico telegrafa le mosse. Tra un piano e l'altro migliori il mazzo scambiando carte.

### Cosa viene da Cardstone e cosa abbiamo cambiato

| Cardstone | Liverstone |
| --- | --- |
| Carte che scorrono "come i piattini del sushi" | Il **nastro**, a cadenza fissa: giocare veloce non fa pescare di più |
| Mana che si ricarica, carte che alzano il massimo | **Cristalli**: si parte con 2–3 mana e si cresce durante lo scontro |
| Un nemico per piano con la sua velocità d'attacco | Attacco base frequente + **mossa speciale** ogni N attacchi, telegrafati |
| Scambio di una carta dopo ogni battaglia | **Ricompensa = sempre uno scambio** (il mazzo resta di 10 carte) |
| "Manica" per tenere carte da parte | **Sleeve** a 2 slot, con dentro la carta speciale dell'eroe |
| Eroi con abilità | 3 eroi con passiva, abilità a mana e carta speciale una volta per run |
| Oro per sbloccare carte, timer "cibo" | Compendio con scoperta delle carte; nessun timer di energia |

---

## 2. Regole del combattimento

- **Start:** lo scontro parte solo quando premi START. Prima puoi **tenere premuto** qualunque cosa per leggerla:
  carte, stati, abilità, ritratto (passiva), barra minaccia (mossa e prossimo speciale), mana.
- **Nastro:** tocca una carta per giocarla, trascinala in su verso il nemico per giocarla, trascinala in giù
  nella sleeve per tenerla. Una carta che esce a sinistra finisce negli scarti (le maledizioni *volatili*
  esplodono o ti puniscono). Quando il mazzo finisce, gli scarti si rimescolano.
- **Mana:** si ricarica di 1 ogni 1–1.5 s (dipende dall'eroe). Il massimo parte basso (2–3) e cresce con le
  carte cristallo (**Mana Shard** +1, **Mana Geode** +2): sono *Innate* (arrivano per prime) ed *Esaurisci*
  (una volta per scontro).
- **Nemici:** un **attacco base** frequente e, ogni N attacchi, una **mossa speciale** (colpo lento e pesante,
  maledizioni, furto, blocco); gli speciali si alternano. La **barra minaccia** sopra il nastro mostra la mossa,
  il valore, il riempimento, i secondi mancanti e un contatore "speciale tra N attacchi".
- **Difesa:** il **Blocco** assorbe i danni ma svanisce col tempo, quindi va giocato poco prima del colpo. La
  barra vita mostra a strisce quanto perderai; i bordi dello schermo lampeggiano poco prima di un colpo non bloccato.
- **Abilità dell'eroe:** mossa potente che **costa molto mana** (4–5), quindi va usata dopo aver fatto crescere i cristalli.
- **Carta speciale:** una per eroe, parte nella sleeve a ogni scontro, si usa **una volta per run**.
- **Stati:** Forza, Blocco, Veleno, Bruciatura, Congelamento (nemico a metà velocità), Stordimento
  (timer fermo), Debole, Vulnerabile, Schivata, Parata, Spellweave, Fortificato… Tocca uno stato per leggerlo.

### La run

- **Atto 1 – La Cripta Dimenticata:** 10 piani lineari: 3 battaglie, falò, battaglia, **élite**, 2 battaglie, falò, **boss**.
  La run è già modellata come grafo, pronta per una mappa a rami.
- **Ricompensa:** sopra tutto il mazzo, sotto 4 carte premio: scegli una carta per parte e **Scambia**, oppure **Salta**.
  Le élite danno carte più rare (comuni 30%, rare 45%, epiche 20%, leggendarie 5%; nelle battaglie normali 64/29/6/1).
- **Falò:** cura il 35% della vita massima, oppure **potenzia** una carta (selezioni, poi confermi).
- **Salvataggio** a ogni piano. Dalla pausa: *Main menu* (la run resta, lo scontro riparte) o *Abandon run*.

---

## 3. Eroi

| | Guerriero | Mago | Negromante |
| --- | --- | --- | --- |
| Vita / mana iniziale / ricarica | 72 / 3 / 1.5 s | 74 / 3 / 1.0 s | 62 / 2 / 1.25 s |
| Archetipo | Blocco e attacchi pesanti | Catene di incantesimi, gelo, fuoco | Veleno |
| Passiva | **Iron Hide**: il Blocco svanisce 2× più lento | **Spellweave**: ogni incantesimo in catena dà +1 danno agli incantesimi (max 5) | **Virulence**: il Veleno fa +1 danno a tick |
| Abilità (mana) | **Berserk** (5): attacchi ×2 per 6 s | **Time Warp** (5): nemico congelato 4 s, nastro accelerato | **Pandemic** (4): raddoppia il Veleno sul nemico |
| Speciale (1 per run) | **Last Stand**: 20 Blocco, 3 Forza | **Meteor**: 25 danni, 5 Bruciatura | **Death's Door**: cura 15, 12 Veleno |
| Mazzo iniziale | 5 Strike, 4 Defend, Mana Geode | 5 Arcane Bolt, 3 Ward, Mana Shard, Mana Geode | 3 Bone Spike, 3 Grave Ward, 2 Toxic Dart, Mana Shard, Mana Geode |

I mazzi iniziali hanno solo carte base; tutte le altre arrivano come ricompensa.

---

## 4. Carte (76)

Rarità: iniziale, comune, rara, epica, leggendaria (+ speciale dell'eroe e maledizioni). Le carte mostrano
**icone e numeri grandi**; il testo completo e il glossario si leggono tenendo premuto. Una condizione è tra parentesi:
Counterstrike "⚔6 / (🛡) ⚔11" fa 11 danni se hai Blocco.

- **Guerriero (22):** Strike, Defend · *comuni* Bash, Cleave, Iron Wall, Shield Bash, Battle Cry, Heavy Blow,
  Bloodletting, Counterstrike · *rare* Parry, War Drums, Whirlwind, Second Wind, Rampage, Bulwark ·
  *epiche* Unbreakable, Execute, Bloodthirst, Juggernaut · *leggendaria* Earthshaker · *speciale* Last Stand.
- **Mago (21):** Arcane Bolt, Ward · *comuni* Frostbolt, Fireball, Ice Lance, Mana Surge, Spark, Frost Armor,
  Ignite, Flurry · *rare* Arcane Missiles, Time Slip, Mirror Image, Combustion, Arcane Echo, Shatter ·
  *epiche* Polymorph, Blizzard, Evocation · *leggendaria* Pyroblast · *speciale* Meteor.
- **Negromante (20):** Bone Spike, Grave Ward, Toxic Dart · *comuni* Drain Life, Rot, Ghoul Bite, Frailty,
  Noxious Cloud, Bone Wall, Blight Burst, Contagion · *rare* Death Coil, Festering Strike, Plague, Wither,
  Siphon Rot · *epiche* Epidemic, Virulent Form · *leggendaria* Black Death · *speciale* Death's Door.
- **Neutrali (8):** Mana Shard, Mana Geode, Healing Potion, Fire Flask, Bandage, Dagger Throw, Smoke Bomb, Mana Potion.
- **Maledizioni (5):** date dai nemici, durano solo lo scontro. **Slime** (intasa il nastro, paghi per toglierlo),
  **Hex** (se esce perdi 4 vita), **Bomb** (se esce esplode: 10 danni), **Leech** (se esce ti ruba 2 mana),
  **Toxin** (se esce ti avvelena di 4).
- **Parole chiave:** Innate (arriva per prima, bandierina), Esaurisci (una volta per scontro), Consuma (sparisce
  dal mazzo), Fugace (sparisce se esce dal nastro), Volatile (effetto all'uscita), Potere (dura tutto lo scontro),
  X (spende tutto il mana).

---

## 5. Nemici (Atto 1)

| Nemico | Vita* | Attacco base | Speciale (ogni N attacchi) |
| --- | --- | --- | --- |
| Crypt Rat | 26 | Bite 3 ogni 2.6 s | ogni 3: Frenzy 3×3 (5 s) |
| Skeleton | 36 | Slash 5 ogni 4 s | ogni 2: Bone Crush 15 (8 s) |
| Ooze | 44 | Slam 5 ogni 4 s | ogni 2, a turno: 2 Slime sul nastro · 2 Toxin nel mazzo |
| Cultist | 40 | Dark Bolt 4 ogni 3.5 s | ogni 3: Dark Ritual, +3 Forza e 1 Leech |
| Goblin Thief | 30 | Stab 4 ogni 3 s | ogni 2, a turno: Snatch (ruba una carta) · Light Fuse (Bomba sul nastro) |
| **Bone Knight** (élite) | 88 | Cleave 7 ogni 4 s | ogni 2, a turno: Rend 12 + Vulnerabile · Shield Wall 18 · sotto metà vita +3 Forza |
| **The Lich** (boss) | 145 | Soul Bolt 6 ogni 3.5 s | ogni 2, a turno: 2 Hex · 2 Bombe · DOOM 26 (10 s) · sotto metà vita +50% velocità |

\*Valori base; in gioco la vita è ×0.85, i danni ×1.05, e i nemici normali crescono del 6% di vita e del 4% di danni per piano.

---

## 6. Schermate e interfaccia

- **Home:** logo animato, Lich, candele pixel animate; Nuova run / Continua, Compendio, Come si gioca, Impostazioni.
- **Scelta eroe:** carosello orizzontale "da videogioco" (eroe grande sul piedistallo, frecce e indicatori).
- **Percorso:** colonna dei piani dell'atto con icone (battaglia, falò, élite, boss).
- **Combattimento**, dall'alto: barra superiore (pausa, piano, velocità 1×/1.5×/2×) · nemico con vita e stati ·
  barra minaccia · **nastro al centro** · mana · sleeve, pile, abilità · eroe in basso (ritratto, vita, stati).
- **Ricompensa, falò, fine run** (statistiche), **Compendio** (carte per classe con scoperte, nemici con mosse).
- **Impostazioni:** musica, effetti, velocità, riduci animazioni, vibrazione. Tutti i testi sono pronti per altre lingue.

## 7. Direzione artistica e audio

- **Riso pop + pixel, un po' dark:** notte viola retinata; carte, bottoni ed etichette come stampe su carta
  con ombre nette sfalsate. Quattro inchiostri: rosa fluo, blu, giallo, inchiostro scuro (+ sovrastampe).
- **Mai:** sfumature per l'ombreggiatura, glow, finto 3D, cerchi decorativi di sfondo, motivi industriali.
- **Pixel art** generata dai disegni vettoriali all'avvio: livelli d'inchiostro, retino a puntini, contorno.
- **Animazioni a scatti** (tranne le finestre, fluide); colpi con flash invertito; danni come "-N" su macchia di sangue.
- **Colori delle carte:** banda del nome = classe (rosa Guerriero, blu Mago, verde Negromante, giallo neutre,
  nero maledizioni); illustrazione = categoria (rosa attacco, blu difesa, giallo utilità, verde maledizione);
  gemma a rombo solo per rare (blu), epiche (rosa) e leggendarie (gialla).
- **Font:** Silkscreen per le parole dei titoli, Jersey 10 per interfaccia e numeri, Space Grotesk per i testi lunghi.
- **Musica chiptune procedurale:** menu (carillon), combattimento, élite (marcia cupa), boss, falò, pausa (calma).
  Effetti sonori sintetizzati, vibrazione sui colpi.

---

## 8. Roadmap

### Prossimi passi (ordine suggerito)

1. Bilanciamento con partite vere. Il bot vince l'atto: Guerriero ~64%, Mago ~43%, Negromante ~67%.
2. Oro, negozio (comprare e rimuovere carte) ed eventi testuali.
3. Reliquie (il motore ha già i punti di aggancio): ~15 reliquie, premi da élite e boss, barra reliquie.
4. Mappa a rami al posto della colonna lineare.
5. Atti 2 e 3, con nuovi nemici, élite, boss e meccaniche.
6. Meta-progressione leggera: pacchetti di carte sbloccabili, statistiche per eroe, piano migliore.
7. Livelli di difficoltà e partita giornaliera.
8. Traduzione italiana (basta aggiungere il file di lingua).
9. App installabile offline (PWA completa).

### Limiti noti

- Uscendo durante uno scontro, lo scontro riparte da capo alla ripresa.
- Il marrone non esiste nei 4 inchiostri: gli occhi "castani" risultano ambra.
- Il bot di bilanciamento è semplice (sfrutta poco la catena del Mago): i suoi numeri sono indicativi.

### Storico

v1.0 prima versione stabile · v1.1 debito tecnico, start gate, nuove ricompense, nemici
base+speciale, abilità a mana, carte sinergiche, musica per élite e pausa. Il dettaglio è nella cronologia git (`git log`).

---

## Task in corso

Legenda: `[ ]` da fare · `[x]` fatto (dettagli nei commit).

- [x] Home: animare anche il tasto New run / Continue run
- [x] Home: la musica a volte non parte o parte in ritardo quando ricarichi o torni al menu
- [x] Combattimento: tasto pausa in alto a destra, a destra della velocità
- [x] Ricompensa: titolo "Enemy cleared" invece di "Victory"
- [x] Fine atto: "VICTORY" grande, animato e con musica dedicata (invece di "Act cleared")
- [x] Potenziamento: carte normali, solo quella selezionata si vede potenziata; solo il tasto "Upgrade"; titolo "Choose a card to upgrade"
- [x] Carte che rallentano il nastro → lo velocizzano (come pescare di più)
- [x] Combattimento: barra vita e barra d'attacco del nemico con colori diversi
- [x] Falò: animazione di cuori fluttuanti dopo la cura, prima di tornare alla mappa
- [ ] Controllo finale del codice: sostenibilità, pulizia, ordine, migliorie
