module.exports = ({ exists, template, addToRoot }) => ({ name }) => {
  if (!/^[A-Z][A-z0-9]*$/.test(name)) {
    throw new Error(`Invalid name "${name}"`);
  }
  const basePath = 'src/application/routes';
  const filename = `${name}Routes.js`;
  const destination = `${basePath}/${filename}`;
  if (exists(destination)) {
    throw new Error(`Route "${filename}" already exists`);
  }

  template('api:Routes.js', destination, { name, nameLower: name.toLowerCase() });
  addToRoot('Routes', name, './application/routes', 'api:register.js');

  console.log(`Routes created at "${destination}"`);
};
