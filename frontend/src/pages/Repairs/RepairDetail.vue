<template>
  <div>
    <h2>Repair {{ repair?.id }}</h2>
    <div v-if="repair">
      <p><strong>Machine:</strong> {{ repair.machineId }}</p>
      <p><strong>Technician:</strong> {{ repair.technicianId }}</p>
      <p><strong>Symptoms:</strong><br/>{{ repair.symptoms }}</p>
      <p><strong>Diagnosis:</strong><br/>{{ repair.diagnosis || '—' }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { api } from '../../services/api'
import { useRoute } from 'vue-router'

export default defineComponent({
  setup() {
    const route = useRoute()
    const repair = ref<any>(null)
    async function load() {
      const id = route.params.id as string
      repair.value = await api.repairs.get(id)
    }
    onMounted(load)
    return { repair }
  }
})
</script>
