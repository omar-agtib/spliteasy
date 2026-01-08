function computeBalances(expenses, memberIds) {
  const balances = {};
  for (const id of memberIds) balances[String(id)] = 0;

  for (const e of expenses) {
    if (e.isDeleted) continue;

    const payer = String(e.paidBy);

    for (const s of e.splitBetween || []) {
      if (s.settled) continue;

      const uid = String(s.userId);
      const share = Number(s.amount) || 0;

      // payer does not owe themselves
      if (uid === payer) continue;

      // outstanding: participant owes payer
      balances[uid] = (balances[uid] || 0) - share;
      balances[payer] = (balances[payer] || 0) + share;
    }
  }

  for (const k of Object.keys(balances))
    balances[k] = Math.round(balances[k] * 100) / 100;
  return balances;
}

function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];

  for (const [userId, bal] of Object.entries(balances)) {
    if (bal > 0.009) creditors.push({ userId, amount: bal });
    else if (bal < -0.009) debtors.push({ userId, amount: -bal });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0,
    j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];

    const pay = Math.min(d.amount, c.amount);
    transfers.push({
      fromUserId: d.userId,
      toUserId: c.userId,
      amount: Math.round(pay * 100) / 100,
    });

    d.amount = Math.round((d.amount - pay) * 100) / 100;
    c.amount = Math.round((c.amount - pay) * 100) / 100;

    if (d.amount <= 0.009) i++;
    if (c.amount <= 0.009) j++;
  }

  return transfers;
}

module.exports = { computeBalances, simplifyDebts };
