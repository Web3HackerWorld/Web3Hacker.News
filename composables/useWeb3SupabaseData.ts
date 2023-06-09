export function useWeb3SupabaseData(table, query, isSingle = true) {
  const { supabase } = $(supabaseStore())
  let key = Object.keys(query).sort().map(_key => `${_key}${query[_key].value}`).join('-')
  key = `${table}-${key}`
  let hasLoaded = $(useState(`loaded-${key}`, () => false))
  let isPending = $(useState(`pending-${key}`, () => false))
  let data = $(useState(`data-${key}`, () => isSingle ? {} : []))

  const doUpdate = async (isForce = false) => {
    if (isPending) {
      // console.log('====> is isPending return:', key)
      return
    }
    if (hasLoaded && !isForce) {
      // console.log('====> !isForce, has data:', data)
      return
    }
    isPending = true

    let $query = supabase.from(table).select().order('created_at', { ascending: false })
    Object.keys(query).forEach((key) => {
      $query = $query.eq(key, query[key].value)
    })
    if (isSingle)
      $query = $query.single()

    const rz = await $query
    isPending = false
    hasLoaded = true

    if (isSingle) {
      data = {
        ...useGet(rz, 'data.metadata', {}),
        ...query,
        address: useGet(rz, 'data.address', ''),
        created_at: useGet(rz, 'data.created_at', ''),
      }
    }
    else {
      data = rz.data
    }
  }

  watchEffect(async () => {
    if (isPending)
      return
    await doUpdate()
  })

  return $$({
    isPending,
    hasLoaded,
    data,
    doUpdate,
  })
}
