<template>
  <div class="map-page">
    <div class="map-container">
      <div id="map"></div>
    </div>

    <q-card class="search-panel" v-show="isSearchPanelVisible">
      <q-card-section>
        <div class="text-h6">{{ $t('Search for restaurant') }}</div>
        <q-input
          v-model="searchRestaurantName"
          :label="$t('Enter the restaurant name')"
          dense
          @keyup.enter="searchRestaurantsByName"
        >
          <template v-slot:append>
            <q-btn round dense flat icon="search" @click="searchRestaurantsByName" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section v-if="searchResults.length > 0">
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
      </q-card-section>

      <q-card-section v-if="searchError" class="text-negative">
        {{ searchError }}
      </q-card-section>
    </q-card>

    <!-- Panel tìm đường -->
    <q-card class="route-panel" v-show="isRoutePanelVisible">
      <q-card-section>
        <div class="text-h6">{{ $t('Find route') }}</div>
        <div class="q-mt-sm">
          <div class="text-subtitle2">{{ $t('Start point') }}:</div>
          <q-input v-model="startPoint.text" readonly dense>
            <template v-slot:append>
              <q-btn round dense flat icon="my_location" @click="selectStartPoint" />
            </template>
          </q-input>
        </div>
        <div class="q-mt-sm">
          <div class="text-subtitle2">{{ $t('Destination point') }}:</div>
          <q-input v-model="destPoint.text" readonly dense>
            <template v-slot:append>
              <q-btn round dense flat icon="place" @click="selectDestPoint" />
            </template>
          </q-input>
        </div>
        <div class="row q-mt-md">
          <q-btn color="primary" class="col" @click="findRoute">{{ $t('Find route') }}</q-btn>
          <q-btn color="negative" class="col q-ml-sm" @click="clearRoute">{{
            $t('Clear route')
          }}</q-btn>
        </div>
      </q-card-section>
    </q-card>

    <!-- Nút ẩn/hiện ô tìm kiếm và tìm đường ở góc dưới bên trái -->
    <q-page-sticky position="bottom-left" :offset="[18, 8]">
      <div class="button-group">
        <q-btn
          round
          color="secondary"
          :icon="isSearchPanelVisible ? 'visibility_off' : 'visibility'"
          @click="toggleSearchPanel"
          class="q-mr-sm"
        >
          <q-tooltip>{{
            isSearchPanelVisible ? $t('Hide search box') : $t('Show search box')
          }}</q-tooltip>
        </q-btn>

        <!-- Nút thêm nhà hàng mới -->
        <q-btn
          round
          color="primary"
          icon="add"
          @click="openAddDialog"
          v-if="isAdmin"
          class="q-mr-sm"
        >
          <q-tooltip>{{ $t('Add new restaurant') }}</q-tooltip>
        </q-btn>

        <!-- Nút bật/tắt tìm đường -->
        <q-btn
          round
          color="accent"
          :icon="isRoutePanelVisible ? 'directions_off' : 'directions'"
          @click="toggleRoutePanel"
        >
          <q-tooltip>{{
            isRoutePanelVisible ? $t('Hide route finder') : $t('Show route finder')
          }}</q-tooltip>
        </q-btn>
      </div>
    </q-page-sticky>

    <!-- Dialog thêm nhà hàng -->
    <q-dialog v-model="addDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ $t('Add new restaurant') }}</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="newRestaurant.name" :label="$t('Restaurant name')" dense />
          <q-input v-model="newRestaurant.cuisine" :label="$t('Cuisine')" dense class="q-mt-sm" />
          <q-input
            v-model="newRestaurant.addr_street"
            :label="$t('Street name')"
            dense
            class="q-mt-sm"
          />
          <q-input
            v-model="newRestaurant.addr_housenumber"
            :label="$t('House number')"
            dense
            class="q-mt-sm"
          />
          <div class="text-caption q-mt-sm">
            {{ $t('Location') }}: {{ selectedPosition.lat }}, {{ selectedPosition.lng }}
          </div>
          <div class="text-caption q-mt-sm text-grey">
            {{ $t('Select a location on the map by clicking the "Select Location" button') }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('Delete')" color="primary" v-close-popup />
          <q-btn
            flat
            :label="$t('Select location')"
            color="secondary"
            @click="startSelectingLocation"
            v-close-popup
          />
          <q-btn
            flat
            :label="$t('Save')"
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
          <div class="text-h6">{{ $t('Edit restaurant information') }}</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="editingRestaurant.properties.name"
            :label="$t('Restaurant name')"
            dense
          />
          <q-input
            v-model="editingRestaurant.properties.cuisine"
            :label="$t('Cuisine')"
            dense
            class="q-mt-sm"
          />
          <q-input
            v-model="editingRestaurant.properties.addr_street"
            :label="$t('Street name')"
            dense
            class="q-mt-sm"
          />
          <q-input
            v-model="editingRestaurant.properties.addr_housenumber"
            :label="$t('House number')"
            dense
            class="q-mt-sm"
          />
          <div class="text-caption q-mt-sm">
            {{ $t('Location') }}: {{ editingPosition.lat }}, {{ editingPosition.lng }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('Cancel')" color="primary" v-close-popup />
          <q-btn
            flat
            :label="$t('Update location')"
            color="secondary"
            @click="startEditingLocation"
            v-close-popup
          />
          <q-btn flat :label="$t('Save')" color="primary" @click="updateRestaurant" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog xác nhận xóa -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">{{ $t('Are you sure you want to delete this restaurant?') }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('Cancel')" color="primary" v-close-popup />
          <q-btn
            flat
            :label="$t('Delete')"
            color="negative"
            @click="deleteRestaurant"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import apiRestaurant from '../../api/restaurant'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { i18n } from 'boot/i18n.js'
import { useUserStore } from 'stores/user'

export default {
  name: 'MapPage',
  setup() {
    const searchRestaurantName = ref('')
    const searchResults = ref([])
    const searchError = ref('')
    const isSearchPanelVisible = ref(true)
    const isRoutePanelVisible = ref(false)
    let map
    let restaurantsLayer
    let tempMarker = null
    let routeLayer = null
    let startMarker = null
    let destMarker = null
    let isSelectingStartPoint = false
    let isSelectingDestPoint = false
    const $t = i18n.global.t
    const userStore = useUserStore()

    const isAdmin = computed(() => userStore.getUser?.role === 'ADMIN')

    const addDialog = ref(false)
    const editDialog = ref(false)
    const deleteDialog = ref(false)

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

    // Trạng thái cho tìm đường
    const startPoint = ref({
      coords: null,
      text: '',
    })
    const destPoint = ref({
      coords: null,
      text: '',
    })

    const toggleSearchPanel = () => {
      isSearchPanelVisible.value = !isSearchPanelVisible.value
    }

    const toggleRoutePanel = () => {
      isRoutePanelVisible.value = !isRoutePanelVisible.value
    }

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

        const response = await apiRestaurant.addRestaurant(payload)

        if (response.status !== 201) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

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
        const response = await apiRestaurant.updateRestaurant(id, payload)

        if (response.status !== 200) {
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
        const response = await apiRestaurant.deleteRestaurant(id)

        if (response.status !== 200) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

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
        const data = await apiRestaurant.getAll()

        restaurantsLayer.clearLayers()

        restaurantsLayer.addData(data)
      } catch (error) {
        console.error('Error fetching restaurants:', error)
        searchError.value = `Lỗi tải dữ liệu: ${error.message}`
      }
    }

    // Hàm chọn điểm bắt đầu cho tìm đường
    const selectStartPoint = () => {
      isSelectingStartPoint = true
      isSelectingDestPoint = false
      map.once('click', (e) => {
        const coord = e.latlng
        startPoint.value.coords = coord
        startPoint.value.text = `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`
        isSelectingStartPoint = false

        // Thêm điểm đánh dấu vị trí bắt đầu
        if (startMarker) {
          map.removeLayer(startMarker)
        }
        startMarker = L.marker(coord, {
          icon: L.icon({
            iconUrl: '/icons/start-point.svg', // Cần cung cấp file SVG này
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }).addTo(map)
      })
    }

    // Hàm chọn điểm đích cho tìm đường
    const selectDestPoint = () => {
      isSelectingStartPoint = false
      isSelectingDestPoint = true
      map.once('click', (e) => {
        const coord = e.latlng
        destPoint.value.coords = coord
        destPoint.value.text = `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`
        isSelectingDestPoint = false

        // Thêm điểm đánh dấu vị trí đích
        if (destMarker) {
          map.removeLayer(destMarker)
        }
        destMarker = L.marker(coord, {
          icon: L.icon({
            iconUrl: '/icons/dest-point.svg', // Cần cung cấp file SVG này
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }).addTo(map)
      })
    }

    // Hàm tìm đường đi
    const findRoute = () => {
      if (!startPoint.value.coords || !destPoint.value.coords) {
        alert($t('Please select both start and destination points.'))
        return
      }

      // Xóa đường đi cũ nếu có
      if (routeLayer) {
        map.removeLayer(routeLayer)
      }

      // Lấy tọa độ điểm bắt đầu và điểm đích
      const startCoord = startPoint.value.coords
      const destCoord = destPoint.value.coords

      // Tạo layer mới để hiển thị đường đi từ GeoServer
      routeLayer = L.tileLayer
        .wms('http://localhost:8080/geoserver/restaurantQGIS/wms', {
          layers: 'restaurantQGIS:route',
          format: 'image/png',
          transparent: true,
          viewparams: `x1:${startCoord.lng};y1:${startCoord.lat};x2:${destCoord.lng};y2:${destCoord.lat}`,
        })
        .addTo(map)
    }

    // Hàm xóa đường đi
    const clearRoute = () => {
      startPoint.value.coords = null
      startPoint.value.text = ''
      destPoint.value.coords = null
      destPoint.value.text = ''

      if (startMarker) {
        map.removeLayer(startMarker)
        startMarker = null
      }

      if (destMarker) {
        map.removeLayer(destMarker)
        destMarker = null
      }

      if (routeLayer) {
        map.removeLayer(routeLayer)
        routeLayer = null
      }
    }

    onMounted(() => {
      map = L.map('map', {
        center: [16.074, 108.224],
        zoom: 12,
        layers: [],
      })

      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      })

      const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '© Google Maps',
        maxZoom: 20,
      })

      const blurLayer = L.tileLayer.wms('http://localhost:8080/geoserver/restaurantQGIS/wms', {
        layers: 'restaurantQGIS:vn_e_danang',
        format: 'image/png',
        transparent: true,
        opacity: 1.0,
      })

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
          // Extract coordinates from the feature's geometry
          const lng = feature.geometry.coordinates[0]
          const lat = feature.geometry.coordinates[1]

          layer.bindPopup(`
            <b>${$t('Restaurant')}:</b> ${props.name || $t('No name')}<br>
            <b>${$t('Cuisine')}:</b> ${props.cuisine || $t('Unknown')}<br>
            <b>${$t('Address')}:</b> ${props.addr_housenumber && props.addr_street ? `${props.addr_housenumber} ${props.addr_street}` : props.addr_housenumber || props.addr_street || $t('No address information available')}<br>
            ${
              isAdmin.value
                ? `<div style="margin-top: 10px;">
              <button 
                onclick="document.dispatchEvent(new CustomEvent('edit-restaurant', {detail: ${props.id}}))"
                style="background-color: #1976D2; color: white; border: none; padding: 5px 10px; margin-right: 5px; cursor: pointer;"
              >
                ${$t('Edit')}
              </button>
              <button 
                onclick="document.dispatchEvent(new CustomEvent('delete-restaurant', {detail: ${props.id}}))"
                style="background-color: #C10015; color: white; border: none; padding: 5px 10px; cursor: pointer;"
              >
                ${$t('Delete')}
              </button>
            </div>
          `
                : ''
            }

            <div style="margin-top: 10px;">
              <button 
                onclick="document.dispatchEvent(new CustomEvent('set-start-point', {detail: {lat: ${lat}, lng: ${lng}}}))"
                style="background-color: #4CAF50; color: white; border: none; padding: 5px 10px; margin-right: 5px; cursor: pointer;"
              >
                ${$t('Set as start point')}
              </button>
              <button 
                onclick="document.dispatchEvent(new CustomEvent('set-dest-point', {detail: {lat: ${lat}, lng: ${lng}}}))"
                style="background-color: #FF9800; color: white; border: none; padding: 5px 10px; cursor: pointer;"
              >
                ${$t('Set as destination')}
              </button>
            </div>
          `)
        },
      })

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

      // Lắng nghe sự kiện đặt điểm bắt đầu từ popup nhà hàng
      document.addEventListener('set-start-point', (e) => {
        const coords = e.detail
        startPoint.value.coords = coords
        startPoint.value.text = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`

        if (startMarker) {
          map.removeLayer(startMarker)
        }
        startMarker = L.marker([coords.lat, coords.lng], {
          icon: L.icon({
            iconUrl: '/icons/start-point.svg',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }).addTo(map)

        if (!isRoutePanelVisible.value) {
          isRoutePanelVisible.value = true
        }
      })

      // Lắng nghe sự kiện đặt điểm đích từ popup nhà hàng
      document.addEventListener('set-dest-point', (e) => {
        const coords = e.detail
        destPoint.value.coords = coords
        destPoint.value.text = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`

        if (destMarker) {
          map.removeLayer(destMarker)
        }
        destMarker = L.marker([coords.lat, coords.lng], {
          icon: L.icon({
            iconUrl: '/icons/dest-point.svg',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }).addTo(map)

        if (!isRoutePanelVisible.value) {
          isRoutePanelVisible.value = true
        }
      })

      fetchRestaurants()

      const baseLayers = {
        OpenStreetMap: osmLayer,
        Satellite: satelliteLayer,
      }

      const overlayLayers = {
        'Lớp mờ các tỉnh/thành khác': blurLayer,
        'Ranh giới Đà Nẵng': danangBoundary,
        'Nhà hàng': restaurantsLayer,
      }

      osmLayer.addTo(map)
      blurLayer.addTo(map)
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

    const searchRestaurantsByName = async () => {
      searchError.value = ''
      if (!searchRestaurantName.value.trim()) {
        searchResults.value = []
        return
      }

      try {
        const data = await apiRestaurant.getByName(searchRestaurantName.value)

        if (data.features && data.features.length > 0) {
          searchResults.value = data.features
        } else {
          searchResults.value = []
          searchError.value =
            `${$t('No restaurants found with the name containing')} "` +
            searchRestaurantName.value +
            '".'
        }
      } catch (error) {
        console.error('Error searching restaurants:', error)
        searchError.value = `${$t('Search error')}: ${error.message}`
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
    }

    return {
      searchRestaurantName,
      isAdmin,
      searchResults,
      searchError,
      searchRestaurantsByName,
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
      isSearchPanelVisible,
      toggleSearchPanel,
      // Route finding
      isRoutePanelVisible,
      toggleRoutePanel,
      startPoint,
      destPoint,
      selectStartPoint,
      selectDestPoint,
      findRoute,
      clearRoute,
      isSelectingDestPoint,
      isSelectingStartPoint,
    }
  },
}
</script>

<style scoped>
.map-page {
  position: relative;
  height: 100%;
  width: 100%;
}

.map-container {
  height: calc(100vh - 100px);
  width: 100%;
  position: relative;
  z-index: 1;
}

#map {
  height: 100%;
  width: 100%;
}

.search-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 999;
  width: 350px;
  max-height: 50vh;
  overflow-y: auto;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.route-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 999;
  width: 350px;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.button-group {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}
</style>
