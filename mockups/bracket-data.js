/* Données du bracket — APEX Invitational 2026, phase finale (8 équipes) */
window.BRACKET_DATA = {
  rounds: [
    {
      label: "Quarts de finale",
      matches: [
        { id: "QF1", status: "done", a: { seed: 1, code: "NB", name: "Team Nebula", color: "#1437D9", score: 2, win: true }, b: { seed: 8, code: "VX", name: "Vortex", color: "#FF5C28", score: 1 } },
        { id: "QF2", status: "done", a: { seed: 4, code: "AP", name: "Apex Predators", color: "#00A854", score: 3, win: true }, b: { seed: 5, code: "SY", name: "Syndicate", color: "#7c3aed", score: 0 } },
        { id: "QF3", status: "live", time: "16:30", a: { seed: 2, code: "QS", name: "Quasar", color: "#0891b2", score: 1 }, b: { seed: 7, code: "RF", name: "Riftwalkers", color: "#db2777", score: 1 } },
        { id: "QF4", status: "scheduled", time: "17:15", a: { seed: 3, code: "TT", name: "Titans", color: "#ca8a04", score: null }, b: { seed: 6, code: "OM", name: "Omega", color: "#16a34a", score: null } },
      ],
    },
    {
      label: "Demi-finales",
      matches: [
        { id: "SF1", status: "scheduled", time: "18:30", a: { seed: 1, code: "NB", name: "Team Nebula", color: "#1437D9", score: null }, b: { seed: 4, code: "AP", name: "Apex Predators", color: "#00A854", score: null } },
        { id: "SF2", status: "pending", a: { tbd: true, name: "Vainqueur QF3" }, b: { tbd: true, name: "Vainqueur QF4" } },
      ],
    },
    {
      label: "Finale",
      matches: [
        { id: "F1", status: "pending", a: { tbd: true, name: "Vainqueur SF1" }, b: { tbd: true, name: "Vainqueur SF2" } },
      ],
    },
  ],
  champion: null, // pas encore décidé
};
