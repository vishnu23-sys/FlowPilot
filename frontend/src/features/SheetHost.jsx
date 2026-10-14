import { useState } from 'react'
import toast from 'react-hot-toast'
import ExpenseSheet from './forms/ExpenseSheet'
import IncomeSheet from './forms/IncomeSheet'
import SubscriptionSheet from './forms/SubscriptionSheet'
import DebtSheet from './forms/DebtSheet'
import { GoalSheet, ContributionSheet } from './forms/GoalSheets'
import { ConfirmDialog } from '../components/ui/Overlay'
import apiClient, { errorMessage } from '../api/apiClient'
import { useFinanceMutation } from '../api/queries'
import { useSheets } from '../lib/sheets'

/** Renders every app-wide sheet; only the one matching sheet.type is open. */
export default function SheetHost() {
  const { sheet, closeSheet } = useSheets()
  const [goalToDelete, setGoalToDelete] = useState(null)
  const is = (type) => sheet.type === type

  const deleteGoal = useFinanceMutation((id) => apiClient.delete(`/api/goals/${id}`))

  return (
    <>
      <ExpenseSheet open={is('expense')} expense={sheet.payload} onClose={closeSheet} />
      <IncomeSheet open={is('income')} entry={sheet.payload} onClose={closeSheet} />
      <SubscriptionSheet open={is('subscription')} sub={sheet.payload} onClose={closeSheet} />
      <DebtSheet open={is('debt')} debt={sheet.payload} onClose={closeSheet} />
      <GoalSheet open={is('goal')} goal={sheet.payload} onClose={closeSheet} onDelete={(g) => { closeSheet(); setGoalToDelete(g) }} />
      <ContributionSheet open={is('contribution')} goal={sheet.payload} onClose={closeSheet} />

      <ConfirmDialog
        open={Boolean(goalToDelete)}
        onOpenChange={(o) => !o && setGoalToDelete(null)}
        title={`Delete ${goalToDelete?.name}?`}
        description="This removes the goal and its contribution history. The money itself isn't affected."
        confirmLabel="Delete goal"
        loading={deleteGoal.isPending}
        onConfirm={() => deleteGoal.mutate(goalToDelete.id, {
          onSuccess: () => { toast.success('Goal deleted'); setGoalToDelete(null) },
          onError: (err) => toast.error(errorMessage(err)),
        })}
      />
    </>
  )
}
