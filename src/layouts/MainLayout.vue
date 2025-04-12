<template>
  <div>
    <q-layout view="lHh Lpr lFf">
      <q-header elevated>
        <q-toolbar>
          <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" />
          <q-toolbar-title>WebGIS Nhà Hàng/Quán Ăn Đà Nẵng</q-toolbar-title>
          <q-btn color="primary" label="Thêm nhà hàng" @click="openAddDialog" />
        </q-toolbar>
      </q-header>

      <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
        <q-list>
          <q-item-label header>Chức năng</q-item-label>
          <q-item>
            <q-item-section>
              <p>Chào mừng bạn đến với WebGIS Đà Nẵng!</p>
              <p>Bản đồ hiển thị thông tin các nhà hàng trong khu vực Thành Phố Đà Nẵng.</p>
            </q-item-section>
          </q-item>
          <q-item-label header>Tìm kiếm nhà hàng</q-item-label>
          <q-item>
            <q-item-section>
              <q-input
                v-model="searchRestaurantName"
                label="Nhập tên nhà hàng"
                dense
                @keyup.enter="searchRestaurants"
              />
              <q-btn color="primary" class="q-mt-sm" label="Tìm" @click="searchRestaurants" />
            </q-item-section>
          </q-item>
          <q-item v-if="searchResults.length > 0">
            <q-item-section>
              <q-list bordered separator>
                <q-item
                  v-for="(result, index) in searchResults"
                  :key="index"
                  clickable
                  @click="panToRestaurant(result)"
                >
                  <q-item-section>{{ result.properties.name }}</q-item-section>
                  <q-item-section side>
                    <q-btn flat round dense icon="edit" @click.stop="openEditDialog(result)" />
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="negative"
                      @click.stop="confirmDelete(result)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-item-section>
          </q-item>
          <q-item v-if="searchError">
            <q-item-section class="text-negative">
              {{ searchError }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-drawer>

      <q-page-container>
        <div id="map" class="map-container"></div>
      </q-page-container>
    </q-layout>

    <!-- Dialog thêm nhà hàng -->
    <q-dialog v-model="addDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Thêm nhà hàng mới</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="newRestaurant.name" label="Tên nhà hàng" dense />
          <q-input v-model="newRestaurant.cuisine" label="Ẩm thực" dense class="q-mt-sm" />
          <q-input v-model="newRestaurant.addr_street" label="Tên đường" dense class="q-mt-sm" />
          <q-input v-model="newRestaurant.addr_housenumber" label="Số nhà" dense class="q-mt-sm" />
          <div class="text-caption q-mt-sm">
            Vị trí: {{ selectedPosition.lat }}, {{ selectedPosition.lng }}
          </div>
          <div class="text-caption q-mt-sm text-grey">
            Chọn vị trí trên bản đồ bằng cách nhấn vào nút "Chọn vị trí"
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Hủy" color="primary" v-close-popup />
          <q-btn
            flat
            label="Chọn vị trí"
            color="secondary"
            @click="startSelectingLocation"
            v-close-popup
          />
          <q-btn
            flat
            label="Lưu"
            color="primary"
            @click="addRestaurant"
            :disable="!isValidRestaurant"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog sửa nhà hàng -->
    <q-dialog v-model="editDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Sửa thông tin nhà hàng</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="editingRestaurant.properties.name" label="Tên nhà hàng" dense />
          <q-input
            v-model="editingRestaurant.properties.cuisine"
            label="Ẩm thực"
            dense
            class="q-mt-sm"
          />
          <q-input
            v-model="editingRestaurant.properties.addr_street"
            label="Tên đường"
            dense
            class="q-mt-sm"
          />
          <q-input
            v-model="editingRestaurant.properties.addr_housenumber"
            label="Số nhà"
            dense
            class="q-mt-sm"
          />
          <div class="text-caption q-mt-sm">
            Vị trí: {{ editingPosition.lat }}, {{ editingPosition.lng }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Hủy" color="primary" v-close-popup />
          <q-btn
            flat
            label="Cập nhật vị trí"
            color="secondary"
            @click="startEditingLocation"
            v-close-popup
          />
          <q-btn flat label="Lưu" color="primary" @click="updateRestaurant" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog xác nhận xóa -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Bạn có chắc chắn muốn xóa nhà hàng này?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Hủy" color="primary" v-close-popup />
          <q-btn flat label="Xóa" color="negative" @click="deleteRestaurant" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default {
  name: 'MainLayout',
  setup() {
    const leftDrawerOpen = ref(true)
    const searchRestaurantName = ref('')
    const searchResults = ref([])
    const searchError = ref('')
    let map
    let restaurantsLayer
    let tempMarker = null

    // Dialog states
    const addDialog = ref(false)
    const editDialog = ref(false)
    const deleteDialog = ref(false)

    // Restaurant data
    const newRestaurant = ref({
      name: '',
      cuisine: '',
      addr_street: '',
      addr_housenumber: '',
      geom: null,
    })

    const selectedPosition = ref({ lat: '', lng: '' })
    const editingRestaurant = ref(null)
    const editingPosition = ref({ lat: '', lng: '' })
    const restaurantToDelete = ref(null)

    const isValidRestaurant = computed(() => {
      return (
        newRestaurant.value.name &&
        selectedPosition.value.lat !== '' &&
        selectedPosition.value.lng !== ''
      )
    })

    const openAddDialog = () => {
      newRestaurant.value = {
        name: '',
        cuisine: '',
        addr_street: '',
        addr_housenumber: '',
        geom: null,
      }
      selectedPosition.value = { lat: '', lng: '' }
      addDialog.value = true
    }

    const openEditDialog = (restaurant) => {
      editingRestaurant.value = JSON.parse(JSON.stringify(restaurant))

      // Extract coordinates
      if (restaurant.geometry && restaurant.geometry.coordinates) {
        const [lng, lat] = restaurant.geometry.coordinates
        editingPosition.value = { lat, lng }
      }

      editDialog.value = true
    }

    const confirmDelete = (restaurant) => {
      restaurantToDelete.value = restaurant
      deleteDialog.value = true
    }

    const startSelectingLocation = () => {
      map.once('click', (e) => {
        selectedPosition.value = { lat: e.latlng.lat, lng: e.latlng.lng }

        newRestaurant.value.latitude = e.latlng.lat
        newRestaurant.value.longitude = e.latlng.lng

        // Add temporary marker
        if (tempMarker) {
          map.removeLayer(tempMarker)
        }
        tempMarker = L.marker(e.latlng).addTo(map)

        addDialog.value = true
      })
    }

    const startEditingLocation = () => {
      map.once('click', (e) => {
        editingPosition.value = { lat: e.latlng.lat, lng: e.latlng.lng }

        // Update GeoJSON for the edited restaurant
        if (editingRestaurant.value) {
          editingRestaurant.value.geometry.coordinates = [e.latlng.lng, e.latlng.lat]
        }

        editDialog.value = true
      })
    }

    const addRestaurant = async () => {
      try {
        const payload = {
          name: newRestaurant.value.name,
          cuisine: newRestaurant.value.cuisine || null,
          addr_street: newRestaurant.value.addr_street || null,
          addr_housenumber: newRestaurant.value.addr_housenumber || null,
          latitude: newRestaurant.value.latitude,
          longitude: newRestaurant.value.longitude,
        }

        const response = await fetch('http://localhost:3000/api/restaurants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        await response.json()

        // Reload the restaurants data
        fetchRestaurants()

        // Clear temp marker
        if (tempMarker) {
          map.removeLayer(tempMarker)
          tempMarker = null
        }

        addDialog.value = false
      } catch (error) {
        console.error('Error adding restaurant:', error)
        searchError.value = `Lỗi thêm nhà hàng: ${error.message}`
      }
    }

    const updateRestaurant = async () => {
      try {
        if (!editingRestaurant.value || !editingRestaurant.value.properties.id) {
          throw new Error('Missing restaurant ID')
        }

        const id = editingRestaurant.value.properties.id
        const payload = {
          name: editingRestaurant.value.properties.name,
          cuisine: editingRestaurant.value.properties.cuisine || null,
          addr_street: editingRestaurant.value.properties.addr_street || null,
          addr_housenumber: editingRestaurant.value.properties.addr_housenumber || null,
          geom: {
            type: 'Point',
            coordinates: [editingPosition.value.lng, editingPosition.value.lat],
          },
        }

        const response = await fetch(`http://localhost:3000/api/restaurants/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Reload the restaurants data
        fetchRestaurants()

        editDialog.value = false
      } catch (error) {
        console.error('Error updating restaurant:', error)
        searchError.value = `Lỗi cập nhật nhà hàng: ${error.message}`
      }
    }

    const deleteRestaurant = async () => {
      try {
        if (!restaurantToDelete.value || !restaurantToDelete.value.properties.id) {
          throw new Error('Missing restaurant ID')
        }

        const id = restaurantToDelete.value.properties.id
        const response = await fetch(`http://localhost:3000/api/restaurants/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Reload the restaurants data
        fetchRestaurants()

        searchResults.value = searchResults.value.filter(
          (r) => r.properties.id !== restaurantToDelete.value.properties.id,
        )

        restaurantToDelete.value = null
      } catch (error) {
        console.error('Error deleting restaurant:', error)
        searchError.value = `Lỗi xóa nhà hàng: ${error.message}`
      }
    }

    const fetchRestaurants = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/restaurants', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Clear existing restaurants
        restaurantsLayer.clearLayers()

        // Add new data
        restaurantsLayer.addData(data)
      } catch (error) {
        console.error('Error fetching restaurants:', error)
        searchError.value = `Lỗi tải dữ liệu: ${error.message}`
      }
    }

    onMounted(() => {
      // Khởi tạo bản đồ
      map = L.map('map', {
        center: [16.074, 108.224],
        zoom: 12,
        layers: [],
      })

      // Định nghĩa các lớp nền
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      })

      const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '© Google Maps',
        maxZoom: 20,
      })

      // Định nghĩa các lớp phủ
      const vietnamBoundary = L.tileLayer.wms(
        'http://localhost:8080/geoserver/restaurantQGIS/wms',
        {
          layers: 'restaurantQGIS:vn_e_danang',
          format: 'image/png',
          transparent: true,
          opacity: 1.0,
        },
      )

      const danangBoundary = L.tileLayer.wms('http://localhost:8080/geoserver/restaurantQGIS/wms', {
        layers: 'restaurantQGIS:border_danang',
        format: 'image/png',
        transparent: true,
        opacity: 1.0,
      })

      const restaurantIcon = L.icon({
        iconUrl: '/icons/food-location.svg',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
      })

      restaurantsLayer = L.geoJSON(null, {
        pointToLayer: (feature, latlng) => L.marker(latlng, { icon: restaurantIcon }),
        onEachFeature: (feature, layer) => {
          const props = feature.properties
          layer.bindPopup(`
            <b>Nhà hàng:</b> ${props.name || 'Không có tên'}<br>
            <b>Ẩm thực:</b> ${props.cuisine || 'Không rõ'}<br>
            <b>Địa chỉ:</b>  ${props.addr_housenumber || ''} ${props.addr_street || ''}<br>
            <div style="margin-top: 10px;">
              <button 
                onclick="document.dispatchEvent(new CustomEvent('edit-restaurant', {detail: ${props.id}}))"
                style="background-color: #1976D2; color: white; border: none; padding: 5px 10px; margin-right: 5px; cursor: pointer;"
              >
                Sửa
              </button>
              <button 
                onclick="document.dispatchEvent(new CustomEvent('delete-restaurant', {detail: ${props.id}}))"
                style="background-color: #C10015; color: white; border: none; padding: 5px 10px; cursor: pointer;"
              >
                Xóa
              </button>
            </div>
          `)
        },
      })

      // Event listeners for popup actions
      document.addEventListener('edit-restaurant', (e) => {
        const id = e.detail
        const restaurant = findRestaurantById(id)
        if (restaurant) {
          openEditDialog(restaurant)
        }
      })

      document.addEventListener('delete-restaurant', (e) => {
        const id = e.detail
        const restaurant = findRestaurantById(id)
        if (restaurant) {
          confirmDelete(restaurant)
        }
      })

      // Tải dữ liệu từ API backend
      fetchRestaurants()

      // Nhóm lớp nền và lớp phủ
      const baseLayers = {
        OpenStreetMap: osmLayer,
        Satellite: satelliteLayer,
      }

      const overlayLayers = {
        'Ranh giới Việt Nam': vietnamBoundary,
        'Ranh giới Đà Nẵng': danangBoundary,
        'Nhà hàng': restaurantsLayer,
      }

      // Thêm lớp nền và lớp phủ
      osmLayer.addTo(map)
      vietnamBoundary.addTo(map)
      danangBoundary.addTo(map)
      restaurantsLayer.addTo(map)

      L.control.layers(baseLayers, overlayLayers).addTo(map)
    })

    const findRestaurantById = (id) => {
      let found = null
      restaurantsLayer.eachLayer((layer) => {
        if (layer.feature.properties.id === id) {
          found = layer.feature
        }
      })
      return found
    }

    const searchRestaurants = async () => {
      searchError.value = ''
      if (!searchRestaurantName.value.trim()) {
        searchResults.value = []
        return
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/restaurants/${searchRestaurantName.value}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.features && data.features.length > 0) {
          searchResults.value = data.features
        } else {
          searchResults.value = []
          searchError.value =
            'Không tìm thấy nhà hàng nào có tên chứa "' + searchRestaurantName.value + '".'
        }
      } catch (error) {
        console.error('Error searching restaurants:', error)
        searchError.value = `Lỗi tìm kiếm: ${error.message}`
        searchResults.value = []
      }
    }

    const panToRestaurant = (restaurant) => {
      if (restaurant && restaurant.geometry && restaurant.geometry.coordinates) {
        const [longitude, latitude] = restaurant.geometry.coordinates
        map.flyTo([latitude, longitude], 16)
        restaurantsLayer.eachLayer((layer) => {
          if (layer.feature.properties.id === restaurant.properties.id) {
            layer.openPopup()
          }
        })
      }
      leftDrawerOpen.value = false
    }

    return {
      leftDrawerOpen,
      toggleLeftDrawer: () => (leftDrawerOpen.value = !leftDrawerOpen.value),
      searchRestaurantName,
      searchResults,
      searchError,
      searchRestaurants,
      panToRestaurant,
      addDialog,
      editDialog,
      deleteDialog,
      newRestaurant,
      selectedPosition,
      editingRestaurant,
      editingPosition,
      openAddDialog,
      openEditDialog,
      confirmDelete,
      startSelectingLocation,
      startEditingLocation,
      addRestaurant,
      updateRestaurant,
      deleteRestaurant,
      isValidRestaurant,
    }
  },
}
</script>

<style scoped>
.map-container {
  height: calc(100vh - 50px);
  width: 100%;
}
</style>
