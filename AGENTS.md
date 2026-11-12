<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep image-export filters in a shared browser-safe predicate and dialog; both financial pages must apply identical inclusive member/date/amount filtering without modifying stored records.
- Calculate the dashboard fund balance in a tested browser-safe helper, and invalidate dashboard/member queries after money changes so navigation reflects saved transactions.
