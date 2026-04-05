FROM node:20-alpine AS builder 

#set the working directory
WORKDIR /app 

# Copy package files first(copying it first ensures that 
# when changes are made in code it doesnt have to copy the entire pack.json.. again) and install dependencies
COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build 

FROM nginx:alpine

# Copy the custom Nginx configuration we just made
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled /dist files from the 'builder' stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
 
