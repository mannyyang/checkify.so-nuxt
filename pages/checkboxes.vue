<script setup lang="ts">
import { ToDoBlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Settings, ExternalLink } from 'lucide-vue-next';

definePageMeta({
  layout: 'embed'
});

const showChecked = ref(true);
const showSidebar = ref(false);

const { data, pending, error, refresh, status } = await useFetch(
  '/api/get-checkboxes',
  {
    lazy: true
  }
);

const metrics = computed(() => {
  if (data.value) {
    return data.value.reduce(
      (acc, page) => {
        page.checkboxes.forEach((checkbox) => {
          if (checkbox.to_do.checked) {
            acc.checked++;
          } else {
            acc.unchecked++;
          }

          acc.total++;
        });
        return acc;
      },
      { checked: 0, unchecked: 0, total: 0 }
    );
  }

  return { checked: 0, unchecked: 0, total: 0 };
});

const percentage = computed(() => {
  return ((metrics.value.checked / metrics.value.total) * 100) || 0;
});

const filtered = computed(() => {
  if (data.value) {
    return data.value.map((page) => {
      return {
        page: page.page,
        checkboxes: page.checkboxes.filter((checkbox) => {
          if (showChecked.value) {
            return checkbox;
          }

          return !checkbox.to_do.checked;
        })
      };
    });
  }

  return [];
});

const checkboxList = computed(() => {
  if (showChecked.value) {
    return data.value;
  } else {
    return filtered.value;
  }
});

const onTodoUpdate = async (checkbox: ToDoBlockObjectResponse, checked: boolean) => {
  checkbox.to_do.checked = checked;
  await useFetch('/api/set-checkbox', {
    method: 'POST',
    body: checkbox
  });
};

const parseBlockLink = (blockId: string, parentId: string) => {
  // Ex. https://www.notion.so/8c25175876f44559804acd1e632791f5?pvs=4#ac313eeb57a541b4a6468cf3ee104b72
  const url = `https://www.notion.so/${parentId.replaceAll(
    '-',
    ''
  )}?pvs=4#${blockId.replaceAll('-', '')}`;
  return url;
};

// refresh every 60 minutes
setTimeout(() => {
  refresh();
}, 3600000);
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Header Toolbar -->
    <div class="fixed top-0 left-0 right-0 z-10 bg-background border-b p-4">
      <div class="flex items-center justify-between">
        <span class="text-lg font-bold">My Todos</span>
        
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="pending"
            @click="refresh"
          >
            <RefreshCw :class="{ 'animate-spin': pending }" class="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Sheet v-model:open="showSidebar">
            <SheetTrigger as-child>
              <Button variant="outline" size="sm">
                <Settings class="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              
              <div class="space-y-6 mt-6">
                <!-- Progress Card -->
                <Card>
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div class="space-y-4">
                      <div class="text-3xl font-bold">
                        {{ percentage.toFixed(1) }}%
                        <span class="text-lg text-muted-foreground">
                          ({{ metrics.checked }}/{{ metrics.total }})
                        </span>
                      </div>
                      <Progress :value="percentage" class="w-full" />
                      <div class="text-xl font-medium">
                        {{ metrics.unchecked }} Remaining
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                <!-- Show Checked Toggle -->
                <div class="flex items-center justify-between">
                  <label for="show-checked" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Show Checked Items
                  </label>
                  <Checkbox
                    id="show-checked"
                    :checked="showChecked"
                    @update:checked="showChecked = $event"
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>

    <!-- Todo List Content -->
    <div class="flex-1 overflow-auto pt-20 p-4">
      <div v-if="!checkboxList || checkboxList.length === 0" class="text-center py-12 text-muted-foreground">
        No todos found
      </div>
      
      <div v-else class="space-y-6">
        <div
          v-for="item in checkboxList"
          :key="item.page.id"
          class="space-y-4"
        >
          <div v-if="item.checkboxes.length" class="space-y-3">
            <h3 class="text-lg font-semibold border-b pb-2">
              {{ item.page.properties['Name']?.title?.[0]?.plain_text }}
            </h3>
            
            <div class="space-y-2">
              <div
                v-for="checkbox in item.checkboxes"
                :key="checkbox.id"
                class="flex items-start gap-3 p-2 rounded-lg hover:bg-accent"
              >
                <Checkbox
                  :id="checkbox.id"
                  :checked="checkbox.to_do.checked"
                  @update:checked="onTodoUpdate(checkbox, $event)"
                  class="mt-1"
                />
                <label :for="checkbox.id" class="flex-1 text-sm leading-relaxed cursor-pointer">
                  {{ checkbox.to_do.rich_text?.[0]?.plain_text || '' }}
                </label>
                <a
                  :href="parseBlockLink(checkbox.id, item.page.id)"
                  target="_blank"
                  class="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink class="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>