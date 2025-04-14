<template>
  <q-card class="myCardClass q-pa-md" flat bordered>
    <q-card-section class="q-gutter-md row items-start">
      <div class="col-8">
        <div class="text-h4 q-mb-sm">{{ $t('Profile') }}</div>
        <div class="text-subtitle1 text-grey">{{ $t('Basic information') }}</div>

        <q-input outlined dense :label="$t('Name')" v-model="userProfile.name" class="q-mb-md" />

        <div class="row q-col-gutter-md q-mb-md">
          <q-input
            outlined
            dense
            :label="$t('Date of Birth')"
            v-model="userProfile.birthday"
            class="col"
            mask="date"
            :rules="['date']"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="userProfile.birthday" mask="YYYY-MM-DD">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-select
            outlined
            dense
            :label="$t('Gender')"
            v-model="userProfile.gender"
            :options="genderOptions"
            class="col"
          />
        </div>

        <div class="text-subtitle1 text-grey">{{ $t('Contact information') }}</div>

        <div class="row q-col-gutter-md">
          <q-input
            outlined
            dense
            :label="$t('Email')"
            v-model="userProfile.email"
            class="col"
            :rules="[
              (val) =>
                (!!val && /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(val)) ||
                'Please enter a valid email',
            ]"
          />
          <q-input
            outlined
            dense
            :label="$t('Phone Number')"
            v-model="userProfile.phone_number"
            class="col"
          />
        </div>

        <q-input
          outlined
          dense
          :label="$t('Address')"
          v-model="userProfile.address"
          class="q-mt-md"
        />
        <q-input
          outlined
          dense
          :label="$t('Current Location')"
          v-model="userProfile.current_location"
          class="q-mt-sm"
        />
      </div>

      <!-- <div class="col-4 flex flex-center">
        <q-img
          :src="userProfile.picture || 'https://cdn.quasar.dev/img/avatar.png'"
          style="width: 220px; height: 220px; border-radius: 50%"
          spinner-color="primary"
        >
          <template v-slot:error>
            <div class="absolute-full flex flex-center bg-grey-3 text-grey-8">No image</div>
          </template>
        </q-img>
      </div> -->
    </q-card-section>

    <q-separator />

    <q-card-actions class="justify-center q-mt-md">
      <q-btn unelevated color="primary" style="width: 50%" @click="submit">
        {{ $t('Submit') }}
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script>
import { defineComponent, ref, unref, toRaw } from 'vue'
import { useUserStore } from 'stores/user'
import { updateProfile } from '../../api/profile.js'
import _cloneDeep from 'lodash/cloneDeep'
import _isEqual from 'lodash/isEqual'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'EditProfileForm',
  setup() {
    const $q = useQuasar()
    const userStore = useUserStore()
    const user = userStore.getUser
    const userProfile = ref(_cloneDeep(user.profile))

    const genderOptions = [
      { label: 'Male', value: 'MALE' },
      { label: 'Female', value: 'FEMALE' },
      { label: 'Other', value: 'OTHER' },
    ]

    const submit = async () => {
      if (!_isEqual(unref(userProfile), userStore.getUser.profile)) {
        try {
          $q.loading.show({
            message: 'Updating profile...',
          })

          const plainProfile = toRaw(unref(userProfile))

          const cleanProfile = JSON.parse(JSON.stringify(plainProfile))
          cleanProfile.birthday = new Date(cleanProfile.birthday).toISOString()

          const response = await updateProfile(cleanProfile.id, cleanProfile)

          userStore.setProfile(response.data)

          $q.loading.hide()
          $q.notify({
            color: 'positive',
            textColor: 'white',
            icon: 'check_circle',
            message: 'Profile updated successfully',
          })
        } catch (e) {
          $q.loading.hide()
          console.error('Update profile failed:', e)
          $q.notify({
            color: 'negative',
            textColor: 'white',
            icon: 'warning',
            message: 'Failed to update profile. Please try again.',
          })
        }
      } else {
        $q.notify({
          color: 'info',
          textColor: 'white',
          icon: 'info',
          message: 'No changes to save',
        })
      }
    }

    return {
      userProfile,
      genderOptions,
      submit,
    }
  },
})
</script>

<style scoped>
.q-card__section {
  gap: 20px;
}
</style>
