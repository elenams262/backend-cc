async function test() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/stats/activity");
    const data = await res.json();
    console.log(JSON.stringify(data.rpeTrend, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
