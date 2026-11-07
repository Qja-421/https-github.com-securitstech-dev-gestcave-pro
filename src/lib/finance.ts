export type TransactionLike = {
  id?: string;
  type?: 'final' | 'acompte' | 'recouvrement' | 'depense' | string;
  total?: number;
  montant?: number;
  montantRecu?: number;
  montantRestant?: number;
  totalVente?: number;
  modePaiement?: string;
  date?: string;
  serveurNom?: string;
};

export type FinancialTotals = {
  encaisse: number;
  facture: number;
  dettes: number;
  depenses: number;
  resultat: number;
  piecesVente: number;
  piecesDepense: number;
};

const money = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const isExpense = (transaction: TransactionLike) => transaction.type === 'depense';

export const receivedAmount = (transaction: TransactionLike) => {
  if (isExpense(transaction)) return 0;
  if (transaction.type === 'recouvrement' || transaction.type === 'acompte') return money(transaction.montant);
  if (transaction.montant !== undefined) return money(transaction.montant);
  if (transaction.montantRecu !== undefined) return money(transaction.montantRecu);
  return money(transaction.total);
};

export const invoicedAmount = (transaction: TransactionLike) => {
  if (isExpense(transaction)) return 0;
  if (transaction.type === 'recouvrement' || transaction.type === 'acompte') return 0;
  if (transaction.totalVente !== undefined) return money(transaction.totalVente);
  if (transaction.total !== undefined) return money(transaction.total);
  if (transaction.montantRecu !== undefined) return money(transaction.montantRecu);
  return money(transaction.montant);
};

export const outstandingAmount = (transaction: TransactionLike) => {
  if (isExpense(transaction)) return 0;
  if (transaction.type === 'recouvrement' || transaction.type === 'acompte') return 0;
  if (transaction.montantRestant !== undefined) return money(transaction.montantRestant);
  return Math.max(0, invoicedAmount(transaction) - receivedAmount(transaction));
};

export const expenseAmount = (transaction: TransactionLike) => {
  if (!isExpense(transaction)) return 0;
  if (transaction.total !== undefined) return money(transaction.total);
  return money(transaction.montant);
};

export const aggregateFinancials = (transactions: TransactionLike[], extraCharges = 0): FinancialTotals => {
  const totals = transactions.reduce<FinancialTotals>((acc, transaction) => {
    const depense = expenseAmount(transaction);
    if (depense > 0) {
      acc.depenses += depense;
      acc.piecesDepense += 1;
      return acc;
    }

    const encaisse = receivedAmount(transaction);
    const facture = invoicedAmount(transaction);
    acc.encaisse += encaisse;
    acc.facture += facture;
    acc.dettes += outstandingAmount(transaction);
    if (encaisse > 0 || facture > 0) acc.piecesVente += 1;
    return acc;
  }, { encaisse: 0, facture: 0, dettes: 0, depenses: 0, resultat: 0, piecesVente: 0, piecesDepense: 0 });

  totals.depenses += extraCharges;
  totals.resultat = totals.encaisse - totals.depenses;
  return totals;
};

export const buildDailyFinancialSeries = (transactions: TransactionLike[], days = 7) => {
  const dataMap: Record<string, { encaisse: number; facture: number; depenses: number; dettes: number }> = {};
  const labels = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    labels.push({ key, name: date.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase() });
    dataMap[key] = { encaisse: 0, facture: 0, depenses: 0, dettes: 0 };
  }

  transactions.forEach((transaction) => {
    const key = (transaction.date || '').slice(0, 10);
    const bucket = dataMap[key];
    if (!bucket) return;

    bucket.encaisse += receivedAmount(transaction);
    bucket.facture += invoicedAmount(transaction);
    bucket.depenses += expenseAmount(transaction);
    bucket.dettes += outstandingAmount(transaction);
  });

  return labels.map(({ key, name }) => ({ name, ...dataMap[key] }));
};
