import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rjitcfqsjjsptbchvmxj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqaXRjZnFzampzcHRiY2h2bXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODMwMTIsImV4cCI6MjA3MTU1OTAxMn0.IYH0Ee4AR_TgRmwc-GVepmS8eXWxVQeildXUKQpH0Tg'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey)

export const supabase = createClient(supabaseUrl, supabaseKey)